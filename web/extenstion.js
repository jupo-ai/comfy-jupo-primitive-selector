import { app } from "../../scripts/app.js";
import { mk_name } from "./utils.js";
import { applyContextMenuPatch } from "./context_menu_patch.js";
import { SpacerWidget } from "./widgets/spacer.js";
import { ButtonWidget } from "./widgets/button.js";
import { PresetWidget } from "./widgets/preset.js";
import { showDialog } from "./ui.js";


const classNames = [
    mk_name("IntSelector"), 
    mk_name("FloatSelector"), 
    mk_name("StringSelector"), 
];


const extension = {
    name: mk_name("Switch"), 

    init: async function() {
        applyContextMenuPatch(classNames);
    }, 

    beforeRegisterNodeDef: async function(nodeType, nodeData, app) {
        if (!classNames.includes(nodeType.comfyClass)) return;

        // --------------------------------------
        // onNodeCreated
        // --------------------------------------
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            const res = origOnNodeCreated?.apply(this, arguments);

            this.hideValuesWidget();
            this.counter = 0;
            this.serialize_widgets = true;
            this.initializeUI();
            this.updateNodeSize();

            return res;
        }


        // --------------------------------------
        // hideValuesWidget
        // --------------------------------------
        nodeType.prototype.hideValuesWidget = function(){
            const widget = this.widgets.find(w => w.name === "values");
            if (widget) {
                widget.type = "hidden";
                widget.hidden = true;

                const index = this.inputs.findIndex(i => i.name === "values");
                if (index !== -1) {
                    this.inputs.splice(index, 1);
                }
            }
        }


        // --------------------------------------
        // initializeUI
        // --------------------------------------
        nodeType.prototype.initializeUI = function() {
            const spacer = new SpacerWidget("spacer", { top: 4, bottom: 4 });
            this.addCustomWidget(spacer);

            // 追加ボタン
            const button = new ButtonWidget("addButton", "➕ 追加", async () => {
                showDialog("", (inputValue) => {
                    this.disableAllWidgets();
                    this.addPresetWidget(inputValue);
                });
                return true;
            });
            this.addCustomWidget(button);

        }


        // --------------------------------------
        // addPresetWidget
        // --------------------------------------
        nodeType.prototype.addPresetWidget = function(inputValue) {
            this.counter++;

            const presetWidget = new PresetWidget(`preset_${this.counter}`, {
                enabled: true, 
                value: inputValue, 
                deleteCallback: (widget) => this.deletePresetWidget(widget), 
                valueChangedCallback: () => this.updateValues(), 
            });

            // spacerの前にウィジェットを挿入
            const spacerIndex = this.widgets.findIndex(w => w.name === "spacer");
            this.widgets.splice(spacerIndex, 0, presetWidget);

            this.updateValues();
            this.updateNodeSize();
            return presetWidget;
        }


        // --------------------------------------
        // deletePresetWidget
        // --------------------------------------
        nodeType.prototype.deletePresetWidget = function(widget) {
            const index = this.widgets.indexOf(widget);
            if (index !== -1) {
                this.widgets.splice(index, 1);
            }
            this.updateValues();
            this.updateNodeSize();
        };

        
        // --------------------------------------
        // clearAllWidgets
        // --------------------------------------
        nodeType.prototype.clearAllWidgets = function() {
            this.widgets = this.widgets.filter(w => w.name === "values");
        };

        // --------------------------------------
        // disableAllWidgets
        // --------------------------------------
        nodeType.prototype.disableAllWidgets = function() {
            this.widgets.forEach(w => {
                if (w instanceof PresetWidget) {
                    w.value.enabled = false;
                }
            });
        }


        // --------------------------------------
        // updateValues
        // --------------------------------------
        nodeType.prototype.updateValues = function() {
            const widget = this.widgets.find(w => w.name === "values");
            if (widget) {
                const presets = this.getPresetWidgets();
                const values = presets.map(w => w.value);
                widget.value = JSON.stringify(values);
            }
        };


        // --------------------------------------
        // getPresetWidgets
        // --------------------------------------
        nodeType.prototype.getPresetWidgets = function() {
            const widgets = this.widgets.filter(w => w instanceof PresetWidget);
            return widgets;
        };


        // --------------------------------------
        // updateNodeSize
        // --------------------------------------
        nodeType.prototype.updateNodeSize = function() {
            const computed = this.computeSize();
            this.size[0] = Math.max(this.size[0], computed[0]);
            this.size[1] = Math.max(this.size[1], computed[1]);
            this.setDirtyCanvas(true);
        };


        // --------------------------------------
        // serialize
        // --------------------------------------
        const origSerialize = nodeType.prototype.serialize;
        nodeType.prototype.serialize = function() {
            const data = origSerialize?.apply(this, arguments) || {};

            const widgets = this.getPresetWidgets();
            data.widgetValues = widgets.map(w => w.value);

            return data;
        };


        // --------------------------------------
        // configure
        // --------------------------------------
        const origConfigure = nodeType.prototype.configure;
        nodeType.prototype.configure = function(data) {
            const res = origConfigure?.apply(this, arguments);

            this.clearAllWidgets();
            this.initializeUI();

            if (data.widgetValues && Array.isArray(data.widgetValues)) {
                data.widgetValues.forEach(value => {
                    const widget = this.addPresetWidget();
                    widget.value = value;
                });
            }

            this.updateValues();
            this.updateNodeSize();
            return res;
        };


        // --------------------------------------
        // コンテキストメニュー
        // --------------------------------------
        nodeType.prototype.getClickedWidget = function(x, y) {
            const widgets = this.getPresetWidgets();
            for (const widget of widgets) {
                if (widget.isClickedAt(x, y, this)) return widget;
            }
            return null;
        }
    }
};

app.registerExtension(extension);