from comfy_api.latest import ComfyExtension
from typing_extensions import override
from .py import nodes

class Extension(ComfyExtension):
    @override
    async def get_node_list(self):
        return [
            nodes.IntSwitch, 
            nodes.FloatSwitch, 
            nodes.StringSwitch, 
        ]


async def comfy_entrypoint():
    return Extension()


WEB_DIRECTORY = "./web"
