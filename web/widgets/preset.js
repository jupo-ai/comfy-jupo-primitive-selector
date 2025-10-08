import { app } from "../../../scripts/app.js";
import { CONSTANTS, Utils, Renderer, showDialog } from "../ui.js";
import { BaseWidget } from "./base.js";


// ==============================================
// プリセットウィジェット
// ==============================================
export class PresetWidget extends BaseWidget {
    constructor(name, options = {}) {
        super(name);

        const { deleteCallback, valueChangedCallback, ...valueOptions } = options;
        this.deleteCallback = deleteCallback;
        this.valueChangedCallback = valueChangedCallback;

        this._value = {
            enabled: true, 
            value: "", 
            ...valueOptions
        };

        this.setupHitAreas();
    }

    get value() { return this._value; }
    set value(v) {
        if (!v) return;
        if (typeof v !== "object") return;

        this._value = { ...this._value, ...v };
        this.valueChangedCallback?.();
    }

    serializeValue(node, index) {
        return this.value;
    }

    setupHitAreas() {
        this.hitAreas = {
            toggle: { bounds: [0, 0], onClick: this.onToggleClick }, 
            name: { bounds: [0, 0], onClick: this.onNameClick }, 
            delete: { bounds: [0, 0], onClick: this.onDeleteClick }
        };
    }

    // ------------------------------------------
    // イベントハンドラ
    // ------------------------------------------
    onToggleClick(event, pos, node) {
        // alway one
        if (this.value.enabled) return;
        node.disableAllWidgets?.();

        this.value.enabled = !this.value.enabled;
        this.valueChangedCallback?.();
        this.cancelMouseDown();
        node.setDirtyCanvas(true);
        return true;
    }

    onNameClick(event, pos, node) {
        showDialog(this.value.value, (inputValue) => {
            this.value.value = inputValue;
            this.valueChangedCallback?.();
            node.setDirtyCanvas(true);
        });

        this.cancelMouseDown();
        return true;
    }

    onDeleteClick(event, pos, node) {
        this.deleteCallback?.(this);
        return true;
    }


    // ------------------------------------------
    // 描画
    // ------------------------------------------
    draw(ctx, node, width, y, height) {
        if (Utils.isLowQuality()) return;

        const margin = CONSTANTS.MARGIN_X;
        const padding = CONSTANTS.PILL.PADDING_X;
        const gap = CONSTANTS.PILL.GAP;
        const pillWidth = width - margin * 2;
        const pillHeight = CONSTANTS.PILL.HEIGHT;
        const pillX = margin;

        ctx.save();

        // メインピル背景
        ctx.beginPath();
        ctx.roundRect(pillX, y, pillWidth, pillHeight, CONSTANTS.PILL.RADIUS);
        ctx.fillStyle = this.value.enabled ? "#2d3748" : "#1a202c";
        ctx.fill();

        ctx.strokeStyle = this.value.enabled ? "#4a5568" : "#2d3748";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
        ctx.save();

        let currentX = pillX + padding;

        // トグルスイッチ
        const state = this.value.enabled ? "on" : "off";
        Renderer.drawToggleSwitch(ctx, currentX, y, state);
        this.hitAreas.toggle.bounds = [currentX, y, CONSTANTS.TOGGLE.WIDTH, pillHeight];
        currentX += CONSTANTS.TOGGLE.WIDTH + gap;

        // 名前表示エリア
        const nameWidth = pillWidth - (currentX - pillX) - gap - CONSTANTS.DELETE.WIDTH - padding;
        ctx.font = `12px ${CONSTANTS.FONT}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const showFullPath = node.displayMode === "full";
        // const displayName = Utils.formatDisplayName(this.value.fileNode.fullPath, showFullPath, this.value.fileNode.displayName);
        const displayName = this.value.value;
        const trimmedName = Utils.fitString(ctx, displayName, nameWidth);

        let textColor = "#e2e8f0";
        let prefix = "";
        if (!this.value.enabled) {
            textColor = "#718096";
        }
        const name = prefix + " " + trimmedName;
        const nameY = y + pillHeight / 2;

        ctx.fillStyle = textColor;
        ctx.fillText(name, currentX, nameY);
        this.hitAreas.name.bounds = [currentX, y, nameWidth, pillHeight];
        currentX += nameWidth + gap;

        // 削除ボタン
        const deleteY = y + CONSTANTS.PILL.PADDING_Y;
        const deleteWidth = CONSTANTS.DELETE.WIDTH;
        const deleteHeight = pillHeight - CONSTANTS.PILL.PADDING_Y * 2;
        ctx.beginPath();
        ctx.roundRect(currentX, deleteY, deleteWidth, deleteHeight, CONSTANTS.DELETE.RADIUS);
        ctx.fillStyle = "#718096";
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        const iconSize = 8;
        const iconX = currentX + deleteWidth / 2;
        const iconY = y + pillHeight / 2;
        ctx.beginPath();
        ctx.moveTo(iconX - iconSize/2, iconY - iconSize/2);
        ctx.lineTo(iconX + iconSize/2, iconY + iconSize/2);
        ctx.moveTo(iconX + iconSize/2, iconY - iconSize/2);
        ctx.lineTo(iconX - iconSize/2, iconY + iconSize/2);
        ctx.stroke();
        this.hitAreas.delete.bounds = [currentX, y, deleteWidth, pillHeight];

        ctx.restore();
    }


    // ------------------------------------------
    // コンテキストメニュー
    // ------------------------------------------
    isClickedAt(x, y, node) {
        // ウィジェットの描画位置を確認
        const widgetY = this.last_y || 0;
        const widgetHeight = CONSTANTS.PILL.HEIGHT;
        const margin = CONSTANTS.MARGIN_X;

        return (x >= margin &&
                x <= node.size[0] - margin &&
                y >= widgetY &&
                y <= widgetY + widgetHeight);
    }

    showContextMenu(event, node) {
        const presetWidgets = node.widgets.filter(w => w instanceof PresetWidget);
        const widgetIndex = presetWidgets.indexOf(this);
        const canMoveUp = widgetIndex > 0;
        const canMoveDown = widgetIndex < presetWidgets.length - 1;

        const menuOptions = [
            {
                content: "⬆️ 上に移動",
                disabled: !canMoveUp, 
                callback: () => {
                    if (canMoveUp) {
                        this.moveUp(node);
                    }
                }
            }, 
            {
                content: "⬇️ 下に移動",
                disabled: !canMoveDown, 
                callback: () => {
                    if (canMoveDown) {
                        this.moveDown(node);
                    }
                }
            }, 
            null, 
            {
                content: "🗑️ 削除",
                callback: () => {
                    node.deletePresetWidget(this);
                }
            }
        ];

        new LiteGraph.ContextMenu(menuOptions, {
            event: event, 
            title: "Primitive Switch", 
            className: "custom-preset-menu", 
            node: node, 
            filter: false
        }, window);
    }

    moveUp(node) {
        const currentIndex = node.widgets.indexOf(this);
        const targetIndex = currentIndex - 1;

        [node.widgets[currentIndex], node.widgets[targetIndex]] = 
        [node.widgets[targetIndex], node.widgets[currentIndex]];

        node.setDirtyCanvas(true);
    }

    moveDown(node) {
        const currentIndex = node.widgets.indexOf(this);
        const targetIndex = currentIndex + 1;

        [node.widgets[currentIndex], node.widgets[targetIndex]] = 
        [node.widgets[targetIndex], node.widgets[currentIndex]];

        node.setDirtyCanvas(true);
    }
}