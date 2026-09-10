# vmd_view_pockets.tcl — visualize hydrophobic-pocket pipeline output
# ============================================================================================
# Loads protein + sites PDB (sites colored by chemistry, sphere radius from B-factor)
# + optional ligand + optional pockets_radius.pdb (one large sphere per pocket).
#
# Usage:
#   vmd -e utils/vmd_view_pockets.tcl
#       (uses default paths configured below)
#
#   vmd -e utils/vmd_view_pockets.tcl -args <topology.pdb> <sites.pdb>
#   vmd -e utils/vmd_view_pockets.tcl -args <topology.pdb> <sites.pdb> <ligand.pdb> <RESNAME>
#   vmd -e utils/vmd_view_pockets.tcl -args <topology.pdb> <sites.pdb> <ligand.pdb> <RESNAME> <pockets_radius.pdb>
#
# pockets.pdb convention (assemble_pockets.py):
#   ResName   HYD / DON / ACC
#   ResSeq    pocket_rank (scored rank; equals hydrophobic_rank when unscored)
#   SegID     hydrophobic_rank (phase-1 rank)
#   Occupancy mean_WFP
#   B-factor  buriedness (HYD) | mean_R90_A (DON/ACC)  → VMD sphere radius for DON/ACC
#
# pockets_radius.pdb convention:
#   one atom per pocket; B-factor = enclosing pocket radius (Å)
#
# Also supports blind-sites style hydrophobic files (e.g., hydrophobics/blind_sites.pdb):
#   ResName   HYD
#   Occupancy S_energy
#   B-factor  composite*100  (auto-detected and rescaled for visualization)
#
# Runtime commands (VMD TkConsole):
#   pk_view                                              ;# (re)load with current paths
#   pk_load <topo> <sites.pdb> [lig.pdb RESNAME] [radius.pdb] ;# load a different target
#   pk_load_hyd <topo> <hyd_sites.pdb> [lig.pdb RESNAME]      ;# load HYD-only sites
#   pk_check_alignment <complex_or_ligand.pdb>                ;# dry-run CA-fit check vs topology
#   pk_list_ligand_atoms <pdb.pdb>                            ;# list resnames in a PDB
#   pk_hyd_only                                                ;# show only HYD sites
#   pk_all_chems                                               ;# show HYD + DON + ACC sites
#   pk_filter_top_n <N>                                        ;# show only top N hydrophobic pockets
#   pk_show_all                                                ;# restore full pocket view
#   pk_show_labels                                             ;# pocket_id + WFP labels
#   pk_hide_labels                                             ;# remove labels
#   pk_help
# ============================================================================================

# ---- default paths (edit to match your target, or override with -args) ----
set ::pk_topology       "data/MDs/1GKY/minimized_system_renamed.pdb"
set ::pk_pockets_pdb    "results/1GKY/hydrophobic_pockets/pockets/pockets.pdb"
set ::pk_radius_pdb     ""   ;# auto-derived: same dir as pockets.pdb / pockets_radius.pdb
set ::pk_ligand_pdb     ""
set ::pk_ligand_resname ""

# chemistry resname -> VMD ColorID (blue=donors, red=acceptors, green=hydrophobics)
array set ::pk_chemcolor {DON 0 ACC 1 HYD 7}

set ::pk_prot_mol    -1
set ::pk_pockets_mol -1
set ::pk_radius_mol  -1
set ::pk_lig_mol     -1
set ::pk_active_filter "all"   ;# updated by pk_filter_top_n / pk_show_all
set ::pk_site_mode "all"        ;# all | hyd


proc pk_help {} {
    puts "pk_view                                                     ;# (re)load with current paths"
    puts "pk_load <topo> <sites.pdb> \[lig.pdb RESNAME\] \[radius.pdb\]  ;# load a target"
    puts "pk_load_hyd <topo> <hyd_sites.pdb> \[lig.pdb RESNAME\]          ;# load HYD-only sites"
    puts "pk_check_alignment <complex_or_ligand.pdb>                   ;# dry-run CA-fit check vs topology"
    puts "pk_list_ligand_atoms <pdb.pdb>                              ;# list resnames in a PDB"
    puts "pk_hyd_only                                                 ;# show only HYD sites"
    puts "pk_all_chems                                                ;# show HYD + DON + ACC sites"
    puts "pk_filter_top_n <N>                                         ;# show only top N hydrophobic pockets"
    puts "pk_show_all                                                 ;# restore full pocket view"
    puts "pk_show_labels                                              ;# pocket_id + WFP labels"
    puts "pk_hide_labels                                              ;# remove labels"
    puts "pk_help"
}


proc _pk_visible_chems {} {
    if {$::pk_site_mode eq "hyd"} {
        return {HYD}
    }
    return {DON ACC HYD}
}


proc _pk_active_chem_selection {} {
    if {$::pk_site_mode eq "hyd"} {
        return "resname HYD"
    }
    return "resname DON ACC HYD"
}


# Try CA-based alignment; if it fails, return 0 ok status and load unaligned.
proc _pk_align_ligand {ref_mol mov_mol} {
    # Shared-resid approach first
    set ref_ca [atomselect $ref_mol "name CA and protein"]
    set mov_ca [atomselect $mov_mol "name CA and protein"]
    set ref_resids [$ref_ca get resid]
    set mov_resids [$mov_ca get resid]
    
    set shared {}
    foreach rid $ref_resids {
        if {[lsearch $mov_resids $rid] >= 0} { lappend shared $rid }
    }
    
    catch {$ref_ca delete}
    catch {$mov_ca delete}
    
    set n_shared [llength $shared]
    if {$n_shared > 0} {
        if {[catch {
            set ref_sel [atomselect $ref_mol "name CA and protein and resid [join $shared { }]"]
            set mov_sel [atomselect $mov_mol "name CA and protein and resid [join $shared { }]"]
            set rmsd_before [measure rmsd $ref_sel $mov_sel]
            set mat [measure fit $mov_sel $ref_sel]
            set all_sel [atomselect $mov_mol "all"]
            $all_sel move $mat
            $all_sel delete
            set rmsd_after [measure rmsd $ref_sel $mov_sel]
            catch {$ref_sel delete}
            catch {$mov_sel delete}
            return [list 1 $n_shared $rmsd_before $rmsd_after "shared-resid"]
        } err]} {
            catch {$ref_sel delete}
            catch {$mov_sel delete}
            puts "  Shared-resid fit failed: $err"
        }
    }
    
    # CA-order fallback
    set ref_ca [atomselect $ref_mol "name CA and protein"]
    set mov_ca [atomselect $mov_mol "name CA and protein"]
    set n_ref [$ref_ca num]
    set n_mov [$mov_ca num]
    
    if {$n_ref > 3 && $n_mov > 3} {
        set n_min [expr {$n_ref < $n_mov ? $n_ref : $n_mov}]
        if {[catch {
            set ref_idx [lrange [$ref_ca get index] 0 [expr {$n_min - 1}]]
            set mov_idx [lrange [$mov_ca get index] 0 [expr {$n_min - 1}]]
            set ref_sel [atomselect $ref_mol "index [join $ref_idx { }]"]
            set mov_sel [atomselect $mov_mol "index [join $mov_idx { }]"]
            set rmsd_before [measure rmsd $ref_sel $mov_sel]
            set mat [measure fit $mov_sel $ref_sel]
            set all_sel [atomselect $mov_mol "all"]
            $all_sel move $mat
            $all_sel delete
            set rmsd_after [measure rmsd $ref_sel $mov_sel]
            catch {$ref_sel delete}
            catch {$mov_sel delete}
            catch {$ref_ca delete}
            catch {$mov_ca delete}
            return [list 1 $n_min $rmsd_before $rmsd_after "ca-order"]
        } err]} {
            puts "  CA-order fit failed: $err"
            catch {$ref_sel delete}
            catch {$mov_sel delete}
        }
    }
    
    catch {$ref_ca delete}
    catch {$mov_ca delete}
    return [list 0 0 0.0 0.0 "no-fit"]
}


proc pk_check_alignment {complex} {
    if {$::pk_prot_mol < 0} { puts "Run pk_view first."; return }
    if {![file exists $complex]} { puts "ERROR: not found: $complex"; return }

    set lm [mol new $complex type pdb waitfor all]
    lassign [_pk_align_ligand $::pk_prot_mol $lm] ok n rmsd_before rmsd_after mode
    mol delete $lm

    if {$ok} {
        puts "Alignment check: $complex"
        puts "  Fit mode           : $mode"
        puts "  CA atoms matched   : $n"
        puts "  RMSD before fit    : [format %.3f $rmsd_before] Å"
        puts "  RMSD after fit     : [format %.3f $rmsd_after] Å"
    } else {
        puts "Alignment check: $complex"
        puts "  Result: NO ALIGNMENT (coordinate frames may differ; ligand will load unaligned)"
    }
}


proc pk_list_ligand_atoms {pdb_file} {
    if {![file exists $pdb_file]} { puts "ERROR: not found: $pdb_file"; return }
    set tm [mol new $pdb_file type pdb waitfor all]
    set all_sel [atomselect $tm "all"]
    set resnames [lsort -unique [$all_sel get resname]]
    $all_sel delete
    puts "Ligand atoms in $pdb_file:"
    foreach rn $resnames {
        set test [atomselect $tm "not protein and resname $rn"]
        if {[$test num] > 0} {
            puts "  $rn"
            $test delete
        }
    }
    mol delete $tm
}


proc pk_ligand {complex resname_or_selection} {
    if {$::pk_prot_mol < 0} { puts "Run pk_view first."; return -1 }
    if {![file exists $complex]} { puts "WARNING: ligand PDB not found: $complex"; return -1 }

    set lm [mol new $complex type pdb waitfor all]
    lassign [_pk_align_ligand $::pk_prot_mol $lm] ok n rmsd_before rmsd_after mode
    
    if {$ok} {
        puts "Ligand alignment ($mode): $n CA | RMSD [format %.3f $rmsd_before] Å -> [format %.3f $rmsd_after] Å"
    } else {
        puts "Ligand loaded without alignment (residue numbering doesn't match topology)"
    }

    mol delrep 0 $lm
    mol addrep $lm

    # Try as a resname first; if it fails, treat as a raw VMD selection string.
    set lig_sel "resname $resname_or_selection and not protein"
    set test_sel [atomselect $lm $lig_sel]
    set n_lig [$test_sel num]
    $test_sel delete

    if {$n_lig == 0} {
        set lig_sel "resname $resname_or_selection"
        set test_sel [atomselect $lm $lig_sel]
        set n_lig [$test_sel num]
        $test_sel delete
    }

    if {$n_lig == 0} {
        # Treat as a direct VMD selection string (e.g., "NMN or resname 3B8")
        if {[catch {set test_sel [atomselect $lm $resname_or_selection]} err] == 0} {
            set n_lig [$test_sel num]
            $test_sel delete
            if {$n_lig > 0} {
                set lig_sel $resname_or_selection
            } else {
                set lig_sel "none"
                puts "WARNING: selection '$resname_or_selection' returned 0 atoms. Hiding ligand molecule."
            }
        } else {
            set lig_sel "none"
            puts "WARNING: resname '$resname_or_selection' not found and not a valid VMD selection. Hiding ligand."
        }
    }

    if {$n_lig > 0} {
        catch {mol modselect 0 $lm $lig_sel}
        mol modstyle  0 $lm Licorice 0.3 18 18
        mol modcolor  0 $lm Type
    } else {
        catch {mol modselect 0 $lm "none"}
    }
    mol rename $lm "ligand_$resname_or_selection"
    return $lm
}


# Set each atom's VDW radius from its B-factor value (with optional scaling).
proc _pk_radius_from_beta {mol_id {min_r 0.5} {scale 1.0}} {
    set sel [atomselect $mol_id "all"]
    set radii {}
    foreach b [$sel get beta] {
        set r [expr {double($b) * double($scale)}]
        if {$r < $min_r} { set r $min_r }
        lappend radii $r
    }
    $sel set radius $radii
    $sel delete
}


proc _pk_guess_sites_mode {mol_id} {
    set sel_don [atomselect $mol_id "resname DON"]
    set n_don [$sel_don num]
    $sel_don delete
    set sel_acc [atomselect $mol_id "resname ACC"]
    set n_acc [$sel_acc num]
    $sel_acc delete
    set sel_hyd [atomselect $mol_id "resname HYD"]
    set n_hyd [$sel_hyd num]
    $sel_hyd delete
    if {$n_hyd > 0 && $n_don == 0 && $n_acc == 0} {
        return "hyd"
    }
    return "all"
}


proc _pk_guess_beta_scale {mol_id} {
    set sel [atomselect $mol_id "all"]
    set betas [$sel get beta]
    $sel delete
    set max_beta 0.0
    foreach b $betas {
        set v [expr {double($b)}]
        if {$v > $max_beta} { set max_beta $v }
    }
    if {$max_beta > 20.0} {
        return [list 0.4 0.025 "score"]
    }
    return [list 0.5 1.0 "angstrom"]
}


proc pk_view {} {
    # clear all molecules
    foreach m [molinfo list] { mol delete $m }
    set ::pk_prot_mol -1; set ::pk_pockets_mol -1
    set ::pk_radius_mol -1; set ::pk_lig_mol -1
    set ::pk_active_filter "all"

    # ── protein ─────────────────────────────────────────────────────────────
    if {![file exists $::pk_topology]} {
        puts "ERROR: topology not found: $::pk_topology"; return
    }
    set ::pk_prot_mol [mol new $::pk_topology type pdb waitfor all]
    mol rename $::pk_prot_mol "protein"
    mol delrep 0 $::pk_prot_mol
    mol addrep $::pk_prot_mol
    mol modselect  0 $::pk_prot_mol "protein"
    mol modstyle   0 $::pk_prot_mol NewCartoon
    mol modcolor   0 $::pk_prot_mol ColorID 8   ;# white/gray

    # ── ligand (optional) ────────────────────────────────────────────────────
    if {$::pk_ligand_pdb ne "" && $::pk_ligand_resname ne ""} {
        set ::pk_lig_mol [pk_ligand $::pk_ligand_pdb $::pk_ligand_resname]
        if {$::pk_lig_mol >= 0} {
            puts "Loaded ligand ($::pk_ligand_pdb, resname $::pk_ligand_resname)."
        }
    }

    # ── pockets_radius.pdb — loaded FIRST so it gets a lower mol ID and renders behind sites
    # Auto-detect only for assemble_pockets outputs (sites file named pockets.pdb).
    if {$::pk_radius_pdb eq "" && [string equal -nocase [file tail $::pk_pockets_pdb] "pockets.pdb"]} {
        set auto [file join [file dirname $::pk_pockets_pdb] "pockets_radius.pdb"]
        if {[file exists $auto]} { set ::pk_radius_pdb $auto }
    }
    if {$::pk_radius_pdb ne "" && [file exists $::pk_radius_pdb]} {
        set ::pk_radius_mol [mol new $::pk_radius_pdb type pdb waitfor all]
        mol rename $::pk_radius_mol "pockets_radius"
        mol delrep 0 $::pk_radius_mol
        _pk_radius_from_beta $::pk_radius_mol 1.0   ;# radius = pocket_radius_A (B-factor)
        mol addrep $::pk_radius_mol
        mol modselect  0 $::pk_radius_mol "all"
        mol modstyle   0 $::pk_radius_mol VDW 1.0 28
        mol modcolor   0 $::pk_radius_mol ColorID 3   ;# orange
        mol modmaterial 0 $::pk_radius_mol Ghost      ;# very transparent — won't occlude sites
        puts "Loaded pocket radii: $::pk_radius_pdb (orange Ghost, radius = B-factor)"
    }

    # ── sites.pdb — loaded AFTER radius so higher mol ID renders in front ──
    if {![file exists $::pk_pockets_pdb]} {
        puts "ERROR: sites PDB not found: $::pk_pockets_pdb"; return
    }
    set ::pk_pockets_mol [mol new $::pk_pockets_pdb type pdb waitfor all]
    mol rename $::pk_pockets_mol "sites"
    mol delrep 0 $::pk_pockets_mol

    # Auto-detect input semantics
    if {$::pk_site_mode ne "hyd"} {
        set ::pk_site_mode [_pk_guess_sites_mode $::pk_pockets_mol]
    }
    lassign [_pk_guess_beta_scale $::pk_pockets_mol] min_r beta_scale beta_mode
    _pk_radius_from_beta $::pk_pockets_mol $min_r $beta_scale
    # In full-pocket mode HYD B-factor = buriedness (0-1); fix display radius to 2 Å
    # so HYD anchors don't shrink. DON/ACC keep their R90-driven radii.
    if {$::pk_site_mode eq "all"} {
        set hyd_fix [atomselect $::pk_pockets_mol "resname HYD"]
        $hyd_fix set radius 2.0
        $hyd_fix delete
    }

    set n_reps_added 0
    foreach res [_pk_visible_chems] {
        set chk [atomselect $::pk_pockets_mol "resname $res"]
        set n [$chk num]
        $chk delete
        if {$n == 0} continue
        mol addrep $::pk_pockets_mol
        set ridx [expr {[molinfo $::pk_pockets_mol get numreps] - 1}]
        mol modselect  $ridx $::pk_pockets_mol "resname $res"
        mol modstyle   $ridx $::pk_pockets_mol VDW 0.6 24
        mol modcolor   $ridx $::pk_pockets_mol ColorID $::pk_chemcolor($res)
        mol modmaterial $ridx $::pk_pockets_mol Transparent
        incr n_reps_added
    }
    if {$n_reps_added == 0} {
        mol addrep $::pk_pockets_mol
        set ridx [expr {[molinfo $::pk_pockets_mol get numreps] - 1}]
        mol modselect  $ridx $::pk_pockets_mol "all"
        mol modstyle   $ridx $::pk_pockets_mol VDW 0.6 24
        mol modcolor   $ridx $::pk_pockets_mol ColorID 7
        mol modmaterial $ridx $::pk_pockets_mol Transparent
        puts "WARNING: no DON/ACC/HYD resnames found in sites PDB; showing all atoms in green."
    }
    set ::pk_active_filter [_pk_active_chem_selection]
    puts "Loaded sites: $::pk_pockets_pdb"
    if {$beta_mode eq "score"} {
        puts "  Detected score-style B-factor (composite*100); auto-rescaled radii for display."
    } else {
        puts "  Using angstrom-style B-factor as radius."
    }
    puts "  HYD=green | DON=blue | ACC=red"

    display resetview
    puts ""
    pk_help
}


proc pk_load {topo pockets {lig_pdb ""} {lig_resname ""} {radius_pdb ""}} {
    set ::pk_topology       $topo
    set ::pk_pockets_pdb    $pockets
    set ::pk_ligand_pdb     $lig_pdb
    set ::pk_ligand_resname $lig_resname
    set ::pk_radius_pdb     $radius_pdb
    set ::pk_site_mode      "all"
    pk_view
}


proc pk_load_hyd {topo hyd_sites {lig_pdb ""} {lig_resname ""}} {
    set ::pk_topology       $topo
    set ::pk_pockets_pdb    $hyd_sites
    set ::pk_ligand_pdb     $lig_pdb
    set ::pk_ligand_resname $lig_resname
    set ::pk_radius_pdb     ""
    set ::pk_site_mode      "hyd"
    pk_view
}


proc pk_filter_top_n {n} {
    if {$::pk_pockets_mol < 0} { puts "Load pockets first (pk_view)."; return }

    while {[molinfo $::pk_pockets_mol get numreps] > 0} { mol delrep 0 $::pk_pockets_mol }
    foreach res [_pk_visible_chems] {
        set sel_str "resname $res and resid <= $n"
        set chk [atomselect $::pk_pockets_mol $sel_str]
        set cnt [$chk num]
        $chk delete
        if {$cnt == 0} continue
        mol addrep $::pk_pockets_mol
        set ridx [expr {[molinfo $::pk_pockets_mol get numreps] - 1}]
        mol modselect  $ridx $::pk_pockets_mol $sel_str
        mol modstyle   $ridx $::pk_pockets_mol VDW 1.0 24
        mol modcolor   $ridx $::pk_pockets_mol ColorID $::pk_chemcolor($res)
        mol modmaterial $ridx $::pk_pockets_mol Transparent
    }

    if {$::pk_radius_mol >= 0} {
        while {[molinfo $::pk_radius_mol get numreps] > 0} { mol delrep 0 $::pk_radius_mol }
        set chk [atomselect $::pk_radius_mol "resid <= $n"]
        if {[$chk num] > 0} {
            mol addrep $::pk_radius_mol
            mol modselect  0 $::pk_radius_mol "resid <= $n"
            mol modstyle   0 $::pk_radius_mol VDW 1.0 28
            mol modcolor   0 $::pk_radius_mol ColorID 3
            mol modmaterial 0 $::pk_radius_mol Ghost
        }
        $chk delete
    }
    set ::pk_active_filter "([_pk_active_chem_selection]) and resid <= $n"
    puts "Showing sites for top $n hydrophobic pockets (pocket_id <= $n). Use pk_show_all to restore."
}


proc pk_show_all {} {
    if {$::pk_pockets_mol < 0} { return }
    catch { graphics $::pk_pockets_mol delete all }

    while {[molinfo $::pk_pockets_mol get numreps] > 0} { mol delrep 0 $::pk_pockets_mol }
    foreach res [_pk_visible_chems] {
        set chk [atomselect $::pk_pockets_mol "resname $res"]
        set n [$chk num]
        $chk delete
        if {$n == 0} continue
        mol addrep $::pk_pockets_mol
        set ridx [expr {[molinfo $::pk_pockets_mol get numreps] - 1}]
        mol modselect  $ridx $::pk_pockets_mol "resname $res"
        mol modstyle   $ridx $::pk_pockets_mol VDW 1.0 24
        mol modcolor   $ridx $::pk_pockets_mol ColorID $::pk_chemcolor($res)
        mol modmaterial $ridx $::pk_pockets_mol Transparent
    }

    if {$::pk_radius_mol >= 0} {
        while {[molinfo $::pk_radius_mol get numreps] > 0} { mol delrep 0 $::pk_radius_mol }
        mol addrep $::pk_radius_mol
        mol modselect  0 $::pk_radius_mol "all"
        mol modstyle   0 $::pk_radius_mol VDW 1.0 28
        mol modcolor   0 $::pk_radius_mol ColorID 3
        mol modmaterial 0 $::pk_radius_mol Ghost
    }
    set ::pk_active_filter [_pk_active_chem_selection]
    puts "All pockets restored."
}


proc pk_hyd_only {} {
    set ::pk_site_mode "hyd"
    pk_show_all
    puts "Hydrophobic-only mode enabled (resname HYD)."
}


proc pk_all_chems {} {
    set ::pk_site_mode "all"
    pk_show_all
    puts "All chemistry mode enabled (HYD, DON, ACC)."
}


proc pk_show_labels {} {
    if {$::pk_pockets_mol < 0} { puts "Load pockets first (pk_view)."; return }
    catch { graphics $::pk_pockets_mol delete all }
    graphics $::pk_pockets_mol color white

    # Label only HYD anchors — one label per pocket, no DON/ACC clutter
    set filter "resname HYD and ($::pk_active_filter)"
    set at [atomselect $::pk_pockets_mol $filter]
    set coords [$at get {x y z}]
    set resids [$at get resid]
    set segids [$at get segid]
    set occs   [$at get occupancy]
    set betas  [$at get beta]
    $at delete

    set n 0
    foreach coord $coords resid $resids segid $segids occ $occs beta $betas {
        set x [expr {[lindex $coord 0] + 0.9}]
        set y [expr {[lindex $coord 1] + 0.9}]
        set z [expr {[lindex $coord 2] + 0.9}]
        set hr [string trim $segid]
        graphics $::pk_pockets_mol text [list $x $y $z] \
            "#${resid} (HR:${hr})  WFP:[format %.2f $occ]  bur:[format %.2f $beta]" \
            size 0.6 thickness 2
        incr n
    }
    puts "$n label(s) shown  (#pocket_rank  HR:hyd_rank  WFP  buriedness). Use pk_hide_labels to remove."
}


proc pk_hide_labels {} {
    if {$::pk_pockets_mol < 0} { return }
    catch { graphics $::pk_pockets_mol delete all }
    puts "Labels removed."
}


# ---- startup: parse -args if given, then load ----
if {[info exists argv] && [llength $argv] >= 2} {
    set ::pk_topology    [lindex $argv 0]
    set ::pk_pockets_pdb [lindex $argv 1]
    if {[llength $argv] >= 4} {
        set ::pk_ligand_pdb     [lindex $argv 2]
        set ::pk_ligand_resname [lindex $argv 3]
    }
    if {[llength $argv] >= 5} {
        set ::pk_radius_pdb [lindex $argv 4]
    }
}
puts "Initializing..."
pk_view
