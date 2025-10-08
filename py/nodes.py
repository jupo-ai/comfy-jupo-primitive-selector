from comfy_api.latest import io
from .utils import mk_name, category
import json


def get_enabled_value(values: list[dict], default=None):
    for v in values:
        if v.get("enabled"): 
            return v.get("value")
    return default


class IntSwitch(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id=mk_name("IntSwitch"), 
            display_name="Int Switch", 
            category=category, 
            inputs=[io.String.Input("values", multiline=True)], 
            outputs=[io.Int.Output()]
        )
    
    @classmethod
    def execute(cls, values: str):
        values = json.loads(values)
        value = get_enabled_value(values, default=0)
        return io.NodeOutput(int(value))




class FloatSwitch(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id=mk_name("FloatSwitch"), 
            display_name="Float Switch", 
            category=category, 
            inputs=[io.String.Input("values", multiline=True)], 
            outputs=[io.Float.Output()]
        )
    
    @classmethod
    def execute(cls, values: str):
        values = json.loads(values)
        value = get_enabled_value(values, default=0.0)
        return io.NodeOutput(float(value))



class StringSwitch(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id=mk_name("StringSwitch"), 
            display_name="String Switch", 
            category=category, 
            inputs=[io.String.Input("values", multiline=True)], 
            outputs=[io.String.Output()]
        )
    
    @classmethod
    def execute(cls, values: str):
        values = json.loads(values)
        value = get_enabled_value(values, default="")
        return io.NodeOutput(str(value))


