'use strict';

var bindAll = require('lodash.bindall');
var transform = require('dom-transform');
var tinycolor = require('tinycolor2');
var Emitter = require('component-emitter');
var isNumber = require('is-number');
var clamp = require('./src/utils/maths/clamp');
var $ = require('./src/utils/jquery/jquery.min.js');

/**
 * Creates a new Colorpicker
 * @param {Object} options
 * @param {String|Number|Object} options.color The default color that the colorpicker will display. Default is #FFFFFF. It can be a hexadecimal number or an hex String.
 * @param {String|Number|Object} options.background The background color of the colorpicker. Default is transparent. It can be a hexadecimal number or an hex String.
 * @param {DomElement} options.el A dom node to add the colorpicker to. You can also use `colorPicker.appendTo(domNode)` afterwards if you prefer.
 * @param {Number} options.width Desired width of the color picker. Default is 175.
 * @param {Number} options.height Desired height of the color picker. Default is 150.
 */
function SimpleColorPicker(options) {
    // options
    options = options || {};

    // properties
    this.color = null;
    this.width = 0;
    this.height = 0;
    this.hue = 0;
    this.choosing = false;
    this.position = {x: 0, y: 0};
    this.huePosition = 0;
    this.saturationWidth = 0;
    this.maxHue = 0;
    this.inputIsNumber = false;

    // bind methods to scope (only if needed)
    bindAll(this, '_onSaturationMouseMove', '_onSaturationMouseDown', '_onSaturationMouseUp', '_onHueMouseDown', '_onHueMouseUp', '_onHueMouseMove');

    // create dom
//    this.$el = document.createElement('div');
//    this.$el.className = 'Scp';
//    this.$el.innerHTML = [
//	'<div class="Scp-saturation">',
//	'<div class="Scp-brightness"></div>',
//	'<div class="Scp-sbSelector"></div>',
//	'</div>',
//	'<div class="Scp-hue">',
//	'<div class="Scp-hSelector"></div>',
//	'</div>'
//    ].join('\n');

    this.$el = $('<div />', {
	class: "Scp",
	html: [
	    '<div class="Scp-saturation">',
	    '<div class="Scp-brightness"></div>',
	    '<div class="Scp-sbSelector"></div>',
	    '</div>',
	    '<div class="Scp-hue">',
	    '<div class="Scp-hSelector"></div>',
	    '</div>'
	].join('\n')
    });


    // dom accessors
    this.$saturation = this.$el.find('.Scp-saturation');
    this.$hue = this.$el.find('.Scp-hue');
    this.$sbSelector = this.$el.find('.Scp-sbSelector');
    this.$hSelector = this.$el.find('.Scp-hSelector');

    // event listeners
//    this.$saturation.addEventListener('mousedown', this._onSaturationMouseDown);
//    this.$saturation.addEventListener('touchstart', this._onSaturationMouseDown);
//    this.$hue.addEventListener('mousedown', this._onHueMouseDown);
//    this.$hue.addEventListener('touchstart', this._onHueMouseDown);

    this.$saturation.on('mousedown', this._onSaturationMouseDown);
    this.$hue.on('mousedown', this._onHueMouseDown);


    // some styling and DOMing from options
    if (options.el) {
	this.appendTo(options.el);
    }
    if (options.background) {
	this.setBackgroundColor(options.background);
    }
    this.setSize(options.width || 175, options.height || 150);
    this.setColor(options.color);

    return this;
}

Emitter(SimpleColorPicker.prototype);

/* =============================================================================
 Public API
 ============================================================================= */
/**
 * Add the colorPicker instance to a Jquery Element.
 * @param  {jqueryElement} Jquery Element
 * @return {colorPicker} returns itself for chaining purpose
 */
SimpleColorPicker.prototype.appendTo = function (jqueryElement) {
    jqueryElement.append(this.$el);
    return this;
};

/**
 * Removes colorpicker from is parent and kill all listeners.
 * Call this method for proper destroy.
 */
SimpleColorPicker.prototype.remove = function () {
    this.$saturation.off('mousedown', this._onSaturationMouseDown);
    this.$hue.off('mousedown', this._onHueMouseDown);
    this._onSaturationMouseUp();
    this._onHueMouseUp();
    this.off();
    this.$el.remove();
};

/**
 * Manually set the current color of the colorpicker. This is the method
 * used on instantiation to convert `color` option to actual color for
 * the colorpicker. Param can be a hexadecimal number or an hex String.
 * @param {String|Number} color hex color desired
 */
SimpleColorPicker.prototype.setColor = function (color) {
    if (isNumber(color)) {
	this.inputIsNumber = true;
	color = '#' + ('00000' + (color | 0).toString(16)).substr(-6);
    } else {
	this.inputIsNumber = false;
    }
    this.color = tinycolor(color);

    var hsvColor = this.color.toHsv();

    if (!isNaN(hsvColor.h)) {
	this.hue = hsvColor.h;
    }

    this._moveSelectorTo(this.saturationWidth * hsvColor.s, (1 - hsvColor.v) * this.height);
    this._moveHueTo((1 - (this.hue / 360)) * this.height);

    this._updateHue();
    return this;
};

/**
 * Set size of the color picker for a given width and height. Note that
 * a padding of 5px will be added if you chose to use the background option
 * of the constructor.
 * @param {Number} width
 * @param {Number} height
 */
SimpleColorPicker.prototype.setSize = function (width, height) {
    this.width = width;
    this.height = height;
    this.$el.css('width', this.width + 'px');
    this.$el.css('height', this.height + 'px');
    this.saturationWidth = this.width - 25;
    this.maxHue = this.height - 2;
    return this;
};

/**
 * Set the background color of the colorpicker. It also adds a 5px padding
 * for design purpose.
 * @param {String|Number} color hex color desired for background
 */
SimpleColorPicker.prototype.setBackgroundColor = function (color) {
    if (isNumber(color)) {
	color = '#' + ('00000' + (color | 0).toString(16)).substr(-6);
    }
    this.$el.css('padding', '5px');
    this.$el.css('background', tinycolor(color).toHexString());
};

/**
 * Removes background of the colorpicker if previously set. It's no use
 * calling this method if you didn't set the background option on start
 * or if you didn't call setBackgroundColor previously.
 */
SimpleColorPicker.prototype.setNoBackground = function () {
    this.$el.css('padding', '0px');
    this.$el.css('background', 'none');
};

/**
 * Registers callback to the update event of the colorpicker.
 * ColorPicker inherits from [component/emitter](https://github.com/component/emitter)
 * so you could do the same thing by calling `colorPicker.on('update');`
 * @param  {Function} callback
 * @return {colorPicker} returns itself for chaining purpose
 */
SimpleColorPicker.prototype.onChange = function (callback) {
    this.on('update', callback);
    this.emit('update', this.getHexString());
    return this;
};

/* =============================================================================
 Color getters
 ============================================================================= */
/**
 * Main color getter, will return a formatted color string depending on input
 * or a number depending on the last setColor call.
 * @return {Number|String}
 */
SimpleColorPicker.prototype.getColor = function () {
    if (this.inputIsNumber) {
	return this.getHexNumber();
    }
    return this.color.toString();
};

/**
 * Returns color as css hex string (ex: '#FF0000').
 * @return {String}
 */
SimpleColorPicker.prototype.getHexString = function () {
    return this.color.toHexString().toUpperCase();
};

/**
 * Returns color as number (ex: 0xFF0000).
 * @return {Number}
 */
SimpleColorPicker.prototype.getHexNumber = function () {
    return parseInt(this.color.toHex(), 16);
};

/**
 * Returns color as {r: 255, g: 0, b: 0} object.
 * @return {Object}
 */
SimpleColorPicker.prototype.getRGB = function () {
    return this.color.toRgb();
};

/**
 * Returns color as {h: 100, s: 1, v: 1} object.
 * @return {Object}
 */
SimpleColorPicker.prototype.getHSV = function () {
    return this.color.toHsv();
};

/**
 * Returns true if color is perceived as dark
 * @return {Boolean}
 */
SimpleColorPicker.prototype.isDark = function () {
    return this.color.isDark();
};

/**
 * Returns true if color is perceived as light
 * @return {Boolean}
 */
SimpleColorPicker.prototype.isLight = function () {
    return this.color.isLight();
};

/* =============================================================================
 "Private" Methods LOL silly javascript
 ============================================================================= */
SimpleColorPicker.prototype._moveSelectorTo = function (x, y) {
    this.position.x = clamp(x, 0, this.saturationWidth);
    this.position.y = clamp(y, 0, this.height);

    transform(this.$sbSelector[0], {
	x: this.position.x,
	y: this.position.y
    });

};

SimpleColorPicker.prototype._updateColorFromPosition = function () {
    this.color = tinycolor({h: this.hue, s: this.position.x / this.saturationWidth, v: 1 - (this.position.y / this.height)});
    this._updateColor();
};

SimpleColorPicker.prototype._moveHueTo = function (y) {
    this.huePosition = clamp(y, 0, this.maxHue);

    transform(this.$hSelector[0], {
	y: this.huePosition
    });

};

SimpleColorPicker.prototype._updateHueFromPosition = function () {
    var hsvColor = this.color.toHsv();
    this.hue = 360 * (1 - (this.huePosition / this.maxHue));
    this.color = tinycolor({h: this.hue, s: hsvColor.s, v: hsvColor.v});
    this._updateHue();
};

SimpleColorPicker.prototype._updateHue = function () {
    var hueColor = tinycolor({h: this.hue, s: 1, v: 1});
    this.$saturation.css('background', 'linear-gradient(to right, #fff 0%, ' + hueColor.toHexString() + ' 100%)');
    this._updateColor();
};

SimpleColorPicker.prototype._updateColor = function () {
    this.$sbSelector.css('background', this.color.toHexString());
    this.$sbSelector.css('borderColor', this.color.isDark() ? '#FFF' : '#000');
    this.emit('update', this.color.toHexString());
};

/* =============================================================================
 Events handlers
 ============================================================================= */
SimpleColorPicker.prototype._onSaturationMouseDown = function (e) {
    this.choosing = true;
    var sbOffset = this.$saturation[0].getBoundingClientRect();
    var xPos = (e.type.indexOf('touch') === 0) ? e.touches[0].clientX : e.clientX;
    var yPos = (e.type.indexOf('touch') === 0) ? e.touches[0].clientY : e.clientY;
    this._moveSelectorTo(xPos - sbOffset.left, yPos - sbOffset.top);
    this._updateColorFromPosition();
    this.$el.on('mouseup', this._onSaturationMouseUp);
    this.$el.on('mousemove', this._onSaturationMouseMove);
    e.preventDefault();
    e.stopPropagation();
};

SimpleColorPicker.prototype._onSaturationMouseMove = function (e) {
    console.log('move');
    var sbOffset = this.$saturation[0].getBoundingClientRect();
    var xPos = (e.type.indexOf('touch') === 0) ? e.touches[0].clientX : e.clientX;
    var yPos = (e.type.indexOf('touch') === 0) ? e.touches[0].clientY : e.clientY;
    this._moveSelectorTo(xPos - sbOffset.left, yPos - sbOffset.top);
    this._updateColorFromPosition();
};

SimpleColorPicker.prototype._onSaturationMouseUp = function () {
    console.log('up');
    this.choosing = false;
    this.$el.off('mouseup', this._onSaturationMouseUp);
    this.$el.off('mousemove', this._onSaturationMouseMove);
};

SimpleColorPicker.prototype._onHueMouseDown = function (e) {
    this.choosing = true;
    var hOffset = this.$hue[0].getBoundingClientRect();
    var yPos = (e.type.indexOf('touch') === 0) ? e.touches[0].clientY : e.clientY;
    this._moveHueTo(yPos - hOffset.top);
    this._updateHueFromPosition();
    this.$el.on('mouseup', this._onHueMouseUp);
    this.$el.on('mousemove', this._onHueMouseMove);
    e.preventDefault();
    e.stopPropagation();

};

SimpleColorPicker.prototype._onHueMouseMove = function (e) {
    var hOffset = this.$hue[0].getBoundingClientRect();
    var yPos = (e.type.indexOf('touch') === 0) ? e.touches[0].clientY : e.clientY;
    this._moveHueTo(yPos - hOffset.top);
    this._updateHueFromPosition();
};

SimpleColorPicker.prototype._onHueMouseUp = function () {
    this.choosing = false;
    this.$el.off('mouseup', this._onHueMouseUp);
    this.$el.off('mousemove', this._onHueMouseMove);
};

module.exports = SimpleColorPicker;
