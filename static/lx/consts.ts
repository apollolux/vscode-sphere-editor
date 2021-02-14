/**
 * lx/consts.ts
 * Global constants for LX & N systems
 * @author Alex Rosario
 */

// IDs
export const ID_GRID_WR_DEF = "lx-grid-default-id";
export const ID_PAL_WR_DEF = "lx-palette-default-id";
export const ID_NCANVAS_DEF = "lx-canvas-default-id";
export const ID_TOOLBAR_DEF = "lx-toolbar-default-id";

// Classes
export const CL_GRID_WR = "lx-grid-wr";
export const CL_GRID_EL = "lx-canvas";
export const CL_PAL_WR = "lx-pal-wr";
export const CL_NCANVAS_WR = "lx-ncanvas";
export const CL_TOOLBAR_WR = "lx-toolbar";
export const CL_GLYPHS_WR = "lx-glyphs-list";

// Element names
export const EL_GRID = "grid";
export const EL_NCANVAS = "ncanvas";
export const EL_COLORPICKER = "form";
export const EL_TOOLBAR = "form";

// Data attributes
export const ATTR_TOOLBAR = "toolbar";
export const ATTR_GRID_AUX = "gridhelper";
export const ATTR_GRID_CFG_LINES = "lines";
export const ATTR_FORM_CTRL_LABEL = "labeltext";
export const ATTR_FORM_FTR = "actions";

// CSS var names
export const CSS_MOUSE_X = "--mouse-x";
export const CSS_MOUSE_Y = "--mouse-y";
export const CSS_PX_W = "--pixel-width";
export const CSS_PX_H = "--pixel-height";
export const CSS_SX = "--grid-scale-x";
export const CSS_SY = "--grid-scale-y";
export const CSS_CURSOR_FG = "--cursor-color-fg";
export const CSS_CURSOR_BG = "--cursor-color-bg";
export const CSS_WIDGET_COLOR_CHANNELS = "--channel-count";

// Custom event names
export const EV_COLORPICK = "lxColorpick";
export const EV_PALETTESELECT = "lxPaletteSelect";
export const EV_CANVASUPDATE = "lxCanvasUpdate";

// Character names
export const CH_CTRL = [
	'NUL', 'SOH', 'SOT', 'EOT', 'EOX', 'ENQ', 'ACK', 'BEL',
	'BCK', 'TAB', 'LF', 'VTB', 'FF', 'CR', 'SO', 'SI',
	'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'EOB',
	'CAN', 'EOM', 'SUB', 'ESC', 'IS4', 'IS3', 'IS2', 'IS1'
];

// NCanvas names
export const NC_LAYER_FG = "foreground";
export const NC_LAYER_BG = "background";
