"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
function GameBoyAdvanceBGMatrixRenderer(gfx, BGLayer) {
	this.gfx = gfx;
    this.BGLayer = BGLayer;
    this.bgAffineRenderer = this.gfx.bgAffineRenderer[BGLayer & 0x1];
	this.preprocess();
}
GameBoyAdvanceBGMatrixRenderer.prototype.tileMapSize = [
	0x80,
	0x100,
	0x200,
	0x400
];
GameBoyAdvanceBGMatrixRenderer.prototype.renderScanLine = function (line) {
	return this.bgAffineRenderer.renderScanLine(line, this);
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchTile = function (tileNumber) {
	//Find the tile code to locate the tile block:
	return this.gfx.VRAM[(tileNumber + (this.gfx.BGScreenBaseBlock[this.BGLayer] << 11)) & 0xFFFF];
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchPixel = function (x, y) {
	//Output pixel:
	if (x > this.mapSizeComparer || y > this.mapSizeComparer) {
		//Overflow Handling:
		if (this.gfx.BGDisplayOverflow[this.BGLayer]) {
			x &= this.mapSizeComparer;
			y &= this.mapSizeComparer;
		}
		else {
			return this.gfx.transparency;
		}
	}
	var address = this.fetchTile((x >> 3) + ((y >> 3) * this.mapSize)) << 6;
	address += this.baseBlockOffset;
	address += (y & 0x7) << 3;
	address += x & 0x7;
	return this.gfx.palette256[this.gfx.VRAM[address]];
}
GameBoyAdvanceBGMatrixRenderer.prototype.preprocess = function () {
	this.mapSize = this.tileMapSize[this.gfx.BGScreenSize[this.BGLayer]];
	this.mapSizeComparer = this.mapSize - 1;
	this.baseBlockOffset = this.gfx.BGCharacterBaseBlock[this.BGLayer] << 14;
}