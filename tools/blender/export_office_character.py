"""Export an artist-authored, rigged character. Does not generate a character.
Run: blender character.blend --background --python tools/blender/export_office_character.py -- output.glb
"""
import bpy
import sys
from pathlib import Path

required = {"Idle", "Walk", "Sit", "Typing", "Wave"}
available = {action.name for action in bpy.data.actions}
missing = required - available
if missing:
    raise RuntimeError("Missing actions: " + ", ".join(sorted(missing)))
if not any(obj.type == 'ARMATURE' for obj in bpy.context.scene.objects):
    raise RuntimeError("An authored humanoid armature is required")
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(args) != 1:
    raise RuntimeError("Provide one output GLB path after --")
output = Path(args[0]).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB',
    export_animations=True, export_animation_mode='ACTIONS', export_skins=True,
    export_morph=True, export_yup=True)
print("Exported", output, "— run the Node validator and inspect visually before integration")
