# Build every asset of the Heure Bleue architecture kit and export raw GLBs.
#   blender -b --factory-startup --python build_kit.py -- <out_dir> [only_name ...]
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from kit_buildings import *
from kit_terrain import *
from kit_extra import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = argv[0] if argv else '/tmp/hb_arch'
only = set(argv[1:])
os.makedirs(out, exist_ok=True)

# wipe the default scene
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob)

ASSETS = [
    # Paris
    lambda: paris('paris_haussmann', bays=5, floors=4, D=11.0, ground='shops', awn=('mustard', 'plaster'), seed=1),
    lambda: paris('paris_narrow', bays=3, floors=4, D=10.0, ground='plain', wall='stone', dormer_style='round', seed=2,
                  balcony_floors=(1,), pots=2),
    lambda: paris('paris_pink', bays=4, floors=3, D=10.0, wall='pink', ground='shops', awn=('powder', 'plaster'), seed=3,
                  balcony_floors=(0,), pots=3),
    lambda: paris('paris_powder', bays=4, floors=4, D=10.5, wall='plaster_warm', ground='plain', dormer_style='round',
                  seed=4, balcony_floors=(1, 3)),
    lambda: paris_rotunda('paris_rotunda'),
    # Mediterranean
    lambda: med_cube_small('med_cube_small'),
    lambda: med_cube_stack('med_cube_stack'),
    lambda: med_villa_tiled('med_villa_tiled'),
    lambda: med_house_gable('med_house_gable'),
    lambda: med_house_gable('med_house_gable_mustard', seed=16, wall='plaster_warm', shutter='cypress', door_c='burgundy'),
    lambda: med_tower_house('med_tower_house'),
    # civic
    lambda: church('church'),
    lambda: cafe('cafe'),
    lambda: hotel('hotel'),
    lambda: fountain('fountain'),
    lambda: belvedere('belvedere'),
    lambda: town_gate('town_gate'),
    # walls / stairs
    lambda: wall_retaining('wall_retaining'),
    lambda: wall_retaining('wall_retaining_flowers', flowers=True, seed=54),
    lambda: wall_low('wall_low'),
    lambda: stairs('stairs'),
    lambda: stairs('stairs_wide', W=6.0, wide=True),
    # roads
    lambda: road_straight('road_straight'),
    lambda: road_curve('road_curve'),
    lambda: road_slope('road_slope'),
    lambda: road_coast('road_coast'),
    lambda: road_curve('road_coast_curve', coast='left'),
    lambda: road_t('road_t'),
    # terrain
    lambda: terrace_block('terrace_block'),
    lambda: terrain_slope('terrain_slope'),
    lambda: headland('headland'),
    lambda: hill_backdrop('hill_backdrop'),
    lambda: rocks_coast('rocks_coast'),
]

metas = {}
for make in ASSETS:
    k, meta = make()
    if only and k.name not in only:
        continue
    ob = k.build()
    me = ob.data
    me.calc_loop_triangles()
    tris = len(me.loop_triangles)
    if os.environ.get('KIT_DEBUG'):
        from collections import Counter
        c = Counter(me.materials[t.material_index].name for t in me.loop_triangles)
        print('BREAKDOWN', k.name, c.most_common(6))
    meta.update(name=k.name, tris=tris, windows=k.win_count, materials=list(k.mats))
    metas[k.name] = meta
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    path = os.path.join(out, k.name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_yup=True, export_normals=True, export_texcoords=False,
                              export_materials='EXPORT', export_extras=False)
    print('EXPORTED', k.name, tris, 'tris')
    bpy.data.objects.remove(ob)

with open(os.path.join(out, 'meta.json'), 'w') as f:
    json.dump(metas, f, indent=1)
