from comfy_api.latest import ComfyExtension
from typing_extensions import override
from .py import nodes

class Extension(ComfyExtension):
    @override
    async def get_node_list(self):
        return [
            nodes.IntSelector, 
            nodes.FloatSelector, 
            nodes.StringSelector, 
        ]


async def comfy_entrypoint():
    return Extension()


WEB_DIRECTORY = "./web"
