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
function ARMInstructionSet(CPUCore) {
	this.CPUCore = CPUCore;
	this.initialize();
}
ARMInstructionSet.prototype.initialize = function () {
	this.IOCore = this.CPUCore.IOCore;
	this.wait = this.IOCore.wait;
	this.registers = this.CPUCore.registers;
	this.resetPipeline();
	this.compileInstructionMap();
}
ARMInstructionSet.prototype.resetPipeline = function () {
	this.fetch = 0;
	this.decode = 0;
	this.execute = 0;
	this.pipelineInvalid = 0x3;
}
ARMInstructionSet.prototype.executeIteration = function () {
	//Push the new fetch access:
	this.fetch = this.wait.CPUGetOpcode32(this.registers[15]);
	//Execute Conditional Instruction:
	this.executeARM(this.instructionMap[(this.execute >> 20) & 0xFF][(this.execute >> 4) & 0xF]);
	//Update the pipelining state:
	this.execute = this.decode;
	this.decode = this.fetch;
}
ARMInstructionSet.prototype.executeARM = function (instruction) {
	if (this.pipelineInvalid == 0) {
		//Check the condition code:
		if (this.conditionCodeTest()) {
			instruction[0](this, instruction[1]);
		}
	}
	else {
		//Tick the pipeline invalidation:
		this.pipelineInvalid >>= 1;
	}
}
ARMInstructionSet.prototype.conditionCodeTest = function () {
	switch (this.execute >> 28) {
		case 0xE:		//AL (always)
						//Put this case first, since it's the most common!
			return true;
		case 0x0:		//EQ (equal)
			if (!this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0x1:		//NE (not equal)
			if (this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0x2:		//CS (unsigned higher or same)
			if (!this.CPUCore.CPSRCarry) {
				return false;
			}
			break;
		case 0x3:		//CC (unsigned lower)
			if (this.CPUCore.CPSRCarry) {
				return false;
			}
			break;
		case 0x4:		//MI (negative)
			if (!this.CPUCore.CPSRNegative) {
				return false;
			}
			break;
		case 0x5:		//PL (positive or zero)
			if (this.CPUCore.CPSRNegative) {
				return false;
			}
			break;
		case 0x6:		//VS (overflow)
			if (!this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0x7:		//VC (no overflow)
			if (this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0x8:		//HI (unsigned higher)
			if (!this.CPUCore.CPSRCarry || this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0x9:		//LS (unsigned lower or same)
			if (this.CPUCore.CPSRCarry && !this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0xA:		//GE (greater or equal)
			if (this.CPUCore.CPSRNegative != this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0xB:		//LT (less than)
			if (this.CPUCore.CPSRNegative == this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0xC:		//GT (greater than)
			if (this.CPUCore.CPSRZero || this.CPUCore.CPSRNegative != this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0xD:		//LE (less than or equal)
			if (!this.CPUCore.CPSRZero && this.CPUCore.CPSRNegative == this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		//case 0xF:		//Reserved (Never Execute)
		default:
			return false;
	}
}
ARMInstructionSet.prototype.compileInstructionMap = function () {
	this.instructionMap = [
		//0
		[
			[
				this.AND,
				this.lli
			],
			[
				this.AND,
				this.llr
			],
			[
				this.AND,
				this.lri
			],
			[
				this.AND,
				this.lrr
			],
			[
				this.AND,
				this.ari
			],
			[
				this.AND,
				this.arr
			],
			[
				this.AND,
				this.rri
			],
			[
				this.AND,
				this.rrr
			],
			[
				this.AND,
				this.lli
			],
			[
				this.MUL,
				this.NOP
			],
			[
				this.AND,
				this.lri
			],
			[
				this.STRH,
				this.ptrm
			],
			[
				this.AND,
				this.ari
			],
			[
				this.LDRD,
				this.ptrm
			],
			[
				this.AND,
				this.rri
			],
			[
				this.STRD,
				this.ptrm
			]
		],
		//1
		[
			[
				this.ANDS,
				this.lli
			],
			[
				this.ANDS,
				this.llr
			],
			[
				this.ANDS,
				this.lri
			],
			[
				this.ANDS,
				this.lrr
			],
			[
				this.ANDS,
				this.ari
			],
			[
				this.ANDS,
				this.arr
			],
			[
				this.ANDS,
				this.rri
			],
			[
				this.ANDS,
				this.rrr
			],
			[
				this.ANDS,
				this.lli
			],
			[
				this.MULS,
				this.NOP
			],
			[
				this.ANDS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrm
			],
			[
				this.ANDS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrm
			],
			[
				this.ANDS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrm
			]
		],
		//2
		[
			[
				this.EOR,
				this.lli
			],
			[
				this.EOR,
				this.llr
			],
			[
				this.EOR,
				this.lri
			],
			[
				this.EOR,
				this.lrr
			],
			[
				this.EOR,
				this.ari
			],
			[
				this.EOR,
				this.arr
			],
			[
				this.EOR,
				this.rri
			],
			[
				this.EOR,
				this.rrr
			],
			[
				this.EOR,
				this.lli
			],
			[
				this.MLA,
				this.NOP
			],
			[
				this.EOR,
				this.lri
			],
			[
				this.STRH,
				this.ptrm
			],
			[
				this.EOR,
				this.ari
			],
			[
				this.LDRD,
				this.ptrm
			],
			[
				this.EOR,
				this.rri
			],
			[
				this.STRD,
				this.ptrm
			]
		],
		//3
		[
			[
				this.EORS,
				this.lli
			],
			[
				this.EORS,
				this.llr
			],
			[
				this.EORS,
				this.lri
			],
			[
				this.EORS,
				this.lrr
			],
			[
				this.EORS,
				this.ari
			],
			[
				this.EORS,
				this.arr
			],
			[
				this.EORS,
				this.rri
			],
			[
				this.EORS,
				this.rrr
			],
			[
				this.EORS,
				this.lli
			],
			[
				this.MLAS,
				this.NOP
			],
			[
				this.EORS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrm
			],
			[
				this.EORS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrm
			],
			[
				this.EORS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrm
			]
		],
		//4
		[
			[
				this.SUB,
				this.lli
			],
			[
				this.SUB,
				this.llr
			],
			[
				this.SUB,
				this.lri
			],
			[
				this.SUB,
				this.lrr
			],
			[
				this.SUB,
				this.ari
			],
			[
				this.SUB,
				this.arr
			],
			[
				this.SUB,
				this.rri
			],
			[
				this.SUB,
				this.rrr
			],
			[
				this.SUB,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SUB,
				this.lri
			],
			[
				this.STRH,
				this.ptim
			],
			[
				this.SUB,
				this.ari
			],
			[
				this.LDRD,
				this.ptim
			],
			[
				this.SUB,
				this.rri
			],
			[
				this.STRD,
				this.ptim
			]
		],
		//5
		[
			[
				this.SUBS,
				this.lli
			],
			[
				this.SUBS,
				this.llr
			],
			[
				this.SUBS,
				this.lri
			],
			[
				this.SUBS,
				this.lrr
			],
			[
				this.SUBS,
				this.ari
			],
			[
				this.SUBS,
				this.arr
			],
			[
				this.SUBS,
				this.rri
			],
			[
				this.SUBS,
				this.rrr
			],
			[
				this.SUBS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SUBS,
				this.lri
			],
			[
				this.LDRH,
				this.ptim
			],
			[
				this.SUBS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptim
			],
			[
				this.SUBS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptim
			]
		],
		//6
		[
			[
				this.RSB,
				this.lli
			],
			[
				this.RSB,
				this.llr
			],
			[
				this.RSB,
				this.lri
			],
			[
				this.RSB,
				this.lrr
			],
			[
				this.RSB,
				this.ari
			],
			[
				this.RSB,
				this.arr
			],
			[
				this.RSB,
				this.rri
			],
			[
				this.RSB,
				this.rrr
			],
			[
				this.RSB,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.RSB,
				this.lri
			],
			[
				this.STRH,
				this.ptim
			],
			[
				this.RSB,
				this.ari
			],
			[
				this.LDRD,
				this.ptim
			],
			[
				this.RSB,
				this.rri
			],
			[
				this.STRD,
				this.ptim
			]
		],
		//7
		[
			[
				this.RSBS,
				this.lli
			],
			[
				this.RSBS,
				this.llr
			],
			[
				this.RSBS,
				this.lri
			],
			[
				this.RSBS,
				this.lrr
			],
			[
				this.RSBS,
				this.ari
			],
			[
				this.RSBS,
				this.arr
			],
			[
				this.RSBS,
				this.rri
			],
			[
				this.RSBS,
				this.rrr
			],
			[
				this.RSBS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.RSBS,
				this.lri
			],
			[
				this.LDRH,
				this.ptim
			],
			[
				this.RSBS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptim
			],
			[
				this.RSBS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptim
			]
		],
		//8
		[
			[
				this.ADD,
				this.lli
			],
			[
				this.ADD,
				this.llr
			],
			[
				this.ADD,
				this.lri
			],
			[
				this.ADD,
				this.lrr
			],
			[
				this.ADD,
				this.ari
			],
			[
				this.ADD,
				this.arr
			],
			[
				this.ADD,
				this.rri
			],
			[
				this.ADD,
				this.rrr
			],
			[
				this.ADD,
				this.lli
			],
			[
				this.UMULL,
				this.NOP
			],
			[
				this.ADD,
				this.lri
			],
			[
				this.STRH,
				this.ptrp
			],
			[
				this.ADD,
				this.ari
			],
			[
				this.LDRD,
				this.ptrp
			],
			[
				this.ADD,
				this.rri
			],
			[
				this.STRD,
				this.ptrp
			]
		],
		//9
		[
			[
				this.ADDS,
				this.lli
			],
			[
				this.ADDS,
				this.llr
			],
			[
				this.ADDS,
				this.lri
			],
			[
				this.ADDS,
				this.lrr
			],
			[
				this.ADDS,
				this.ari
			],
			[
				this.ADDS,
				this.arr
			],
			[
				this.ADDS,
				this.rri
			],
			[
				this.ADDS,
				this.rrr
			],
			[
				this.ADDS,
				this.lli
			],
			[
				this.UMULLS,
				this.NOP
			],
			[
				this.ADDS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrp
			],
			[
				this.ADDS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrp
			],
			[
				this.ADDS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrp
			]
		],
		//A
		[
			[
				this.ADC,
				this.lli
			],
			[
				this.ADC,
				this.llr
			],
			[
				this.ADC,
				this.lri
			],
			[
				this.ADC,
				this.lrr
			],
			[
				this.ADC,
				this.ari
			],
			[
				this.ADC,
				this.arr
			],
			[
				this.ADC,
				this.rri
			],
			[
				this.ADC,
				this.rrr
			],
			[
				this.ADC,
				this.lli
			],
			[
				this.UMLAL,
				this.NOP
			],
			[
				this.ADC,
				this.lri
			],
			[
				this.STRH,
				this.ptrp
			],
			[
				this.ADC,
				this.ari
			],
			[
				this.LDRD,
				this.ptrp
			],
			[
				this.ADC,
				this.rri
			],
			[
				this.STRD,
				this.ptrp
			]
		],
		//B
		[
			[
				this.ADCS,
				this.lli
			],
			[
				this.ADCS,
				this.llr
			],
			[
				this.ADCS,
				this.lri
			],
			[
				this.ADCS,
				this.lrr
			],
			[
				this.ADCS,
				this.ari
			],
			[
				this.ADCS,
				this.arr
			],
			[
				this.ADCS,
				this.rri
			],
			[
				this.ADCS,
				this.rrr
			],
			[
				this.ADCS,
				this.lli
			],
			[
				this.UMLALS,
				this.NOP
			],
			[
				this.ADCS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrp
			],
			[
				this.ADCS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrp
			],
			[
				this.ADCS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrp
			]
		],
		//C
		[
			[
				this.SBC,
				this.lli
			],
			[
				this.SBC,
				this.llr
			],
			[
				this.SBC,
				this.lri
			],
			[
				this.SBC,
				this.lrr
			],
			[
				this.SBC,
				this.ari
			],
			[
				this.SBC,
				this.arr
			],
			[
				this.SBC,
				this.rri
			],
			[
				this.SBC,
				this.rrr
			],
			[
				this.SBC,
				this.lli
			],
			[
				this.SMULL,
				this.NOP
			],
			[
				this.SBC,
				this.lri
			],
			[
				this.STRH,
				this.ptip
			],
			[
				this.SBC,
				this.ari
			],
			[
				this.LDRD,
				this.ptip
			],
			[
				this.SBC,
				this.rri
			],
			[
				this.STRD,
				this.ptip
			]
		],
		//D
		[
			[
				this.SBCS,
				this.lli
			],
			[
				this.SBCS,
				this.llr
			],
			[
				this.SBCS,
				this.lri
			],
			[
				this.SBCS,
				this.lrr
			],
			[
				this.SBCS,
				this.ari
			],
			[
				this.SBCS,
				this.arr
			],
			[
				this.SBCS,
				this.rri
			],
			[
				this.SBCS,
				this.rrr
			],
			[
				this.SBCS,
				this.lli
			],
			[
				this.SMULLS,
				this.NOP
			],
			[
				this.SBCS,
				this.lri
			],
			[
				this.LDRH,
				this.ptip
			],
			[
				this.SBCS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptip
			],
			[
				this.SBCS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptip
			]
		],
		//E
		[
			[
				this.RSC,
				this.lli
			],
			[
				this.RSC,
				this.llr
			],
			[
				this.RSC,
				this.lri
			],
			[
				this.RSC,
				this.lrr
			],
			[
				this.RSC,
				this.ari
			],
			[
				this.RSC,
				this.arr
			],
			[
				this.RSC,
				this.rri
			],
			[
				this.RSC,
				this.rrr
			],
			[
				this.RSC,
				this.lli
			],
			[
				this.SMLAL,
				this.NOP
			],
			[
				this.RSC,
				this.lri
			],
			[
				this.STRH,
				this.ptip
			],
			[
				this.RSC,
				this.ari
			],
			[
				this.LDRD,
				this.ptip
			],
			[
				this.RSC,
				this.rri
			],
			[
				this.STRD,
				this.ptip
			]
		],
		//F
		[
			[
				this.RSCS,
				this.lli
			],
			[
				this.RSCS,
				this.llr
			],
			[
				this.RSCS,
				this.lri
			],
			[
				this.RSCS,
				this.lrr
			],
			[
				this.RSCS,
				this.ari
			],
			[
				this.RSCS,
				this.arr
			],
			[
				this.RSCS,
				this.rri
			],
			[
				this.RSCS,
				this.rrr
			],
			[
				this.RSCS,
				this.lli
			],
			[
				this.SMLALS,
				this.NOP
			],
			[
				this.RSCS,
				this.lri
			],
			[
				this.LDRH,
				this.ptip
			],
			[
				this.RSCS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptip
			],
			[
				this.RSCS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptip
			]
		],
		//10
		[
			[
				this.MRS,
				this.rc
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QADD,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMLABB,
				this.NOP
			],
			[
				this.SWP,
				this.NOP
			],
			[
				this.SMLATB,
				this.NOP
			],
			[
				this.STRH,
				this.ofrm
			],
			[
				this.SMLABT,
				this.NOP
			],
			[
				this.LDRD,
				this.ofrm
			],
			[
				this.SMLATT,
				this.NOP
			],
			[
				this.STRD,
				this.ofrm
			]
		],
		//11
		[
			[
				this.TSTS,
				this.lli
			],
			[
				this.TSTS,
				this.llr
			],
			[
				this.TSTS,
				this.lri
			],
			[
				this.TSTS,
				this.lrr
			],
			[
				this.TSTS,
				this.ari
			],
			[
				this.TSTS,
				this.arr
			],
			[
				this.TSTS,
				this.rri
			],
			[
				this.TSTS,
				this.rrr
			],
			[
				this.TSTS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.TSTS,
				this.lri
			],
			[
				this.LDRH,
				this.ofrm
			],
			[
				this.TSTS,
				this.ari
			],
			[
				this.LDRSB,
				this.ofrm
			],
			[
				this.TSTS,
				this.rri
			],
			[
				this.LDRSH,
				this.ofrm
			]
		],
		//12
		[
			[
				this.MSR,
				this.rc
			],
			[
				this.BX,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QSUB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMLAWB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMULWB,
				this.NOP
			],
			[
				this.STRH,
				this.pprm
			],
			[
				this.SMLAWT,
				this.NOP
			],
			[
				this.LDRD,
				this.prrm
			],
			[
				this.SMULWT,
				this.NOP
			],
			[
				this.STRD,
				this.prrm
			]
		],
		//13
		[
			[
				this.TEQS,
				this.lli
			],
			[
				this.TEQS,
				this.llr
			],
			[
				this.TEQS,
				this.lri
			],
			[
				this.TEQS,
				this.lrr
			],
			[
				this.TEQS,
				this.ari
			],
			[
				this.TEQS,
				this.arr
			],
			[
				this.TEQS,
				this.rri
			],
			[
				this.TEQS,
				this.rrr
			],
			[
				this.TEQS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.TEQS,
				this.lri
			],
			[
				this.LDRH,
				this.prrm
			],
			[
				this.TEQS,
				this.ari
			],
			[
				this.LDRSB,
				this.prrm
			],
			[
				this.TEQS,
				this.rri
			],
			[
				this.LDRSH,
				this.prrm
			]
		],
		//14
		[
			[
				this.MRS,
				this.rs
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QDADD,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMLALBB,
				this.NOP
			],
			[
				this.SWPB,
				this.NOP
			],
			[
				this.SMLALTB,
				this.NOP
			],
			[
				this.STRH,
				this.ofim
			],
			[
				this.SMLALBT,
				this.NOP
			],
			[
				this.LDRD,
				this.ofim
			],
			[
				this.SMLALTT,
				this.NOP
			],
			[
				this.STRD,
				this.ofim
			]
		],
		//15
		[
			[
				this.CMPS,
				this.lli
			],
			[
				this.CMPS,
				this.llr
			],
			[
				this.CMPS,
				this.lri
			],
			[
				this.CMPS,
				this.lrr
			],
			[
				this.CMPS,
				this.ari
			],
			[
				this.CMPS,
				this.arr
			],
			[
				this.CMPS,
				this.rri
			],
			[
				this.CMPS,
				this.rrr
			],
			[
				this.CMPS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.CMPS,
				this.lri
			],
			[
				this.LDRH,
				this.ofim
			],
			[
				this.CMPS,
				this.ari
			],
			[
				this.LDRSB,
				this.ofim
			],
			[
				this.CMPS,
				this.rri
			],
			[
				this.LDRSH,
				this.ofim
			]
		],
		//16
		[
			[
				this.MSR,
				this.rs
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QDSUB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMULBB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMULTB,
				this.NOP
			],
			[
				this.STRH,
				this.prim
			],
			[
				this.SMULBT,
				this.NOP
			],
			[
				this.LDRD,
				this.prim
			],
			[
				this.SMULTT,
				this.NOP
			],
			[
				this.STRD,
				this.prim
			]
		],
		//17
		[
			[
				this.CMNS,
				this.lli
			],
			[
				this.CMNS,
				this.llr
			],
			[
				this.CMNS,
				this.lri
			],
			[
				this.CMNS,
				this.lrr
			],
			[
				this.CMNS,
				this.ari
			],
			[
				this.CMNS,
				this.arr
			],
			[
				this.CMNS,
				this.rri
			],
			[
				this.CMNS,
				this.rrr
			],
			[
				this.CMNS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.CMNS,
				this.lri
			],
			[
				this.LDRH,
				this.prim
			],
			[
				this.CMNS,
				this.ari
			],
			[
				this.LDRSB,
				this.prim
			],
			[
				this.CMNS,
				this.rri
			],
			[
				this.LDRSH,
				this.prim
			]
		],
		//18
		[
			[
				this.ORR,
				this.lli
			],
			[
				this.ORR,
				this.llr
			],
			[
				this.ORR,
				this.lri
			],
			[
				this.ORR,
				this.lrr
			],
			[
				this.ORR,
				this.ari
			],
			[
				this.ORR,
				this.arr
			],
			[
				this.ORR,
				this.rri
			],
			[
				this.ORR,
				this.rrr
			],
			[
				this.ORR,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.ORR,
				this.lri
			],
			[
				this.STRH,
				this.ofrp
			],
			[
				this.ORR,
				this.ari
			],
			[
				this.LDRD,
				this.ofrp
			],
			[
				this.ORR,
				this.rri
			],
			[
				this.STRD,
				this.ofrp
			]
		],
		//19
		[
			[
				this.ORRS,
				this.lli
			],
			[
				this.ORRS,
				this.llr
			],
			[
				this.ORRS,
				this.lri
			],
			[
				this.ORRS,
				this.lrr
			],
			[
				this.ORRS,
				this.ari
			],
			[
				this.ORRS,
				this.arr
			],
			[
				this.ORRS,
				this.rri
			],
			[
				this.ORRS,
				this.rrr
			],
			[
				this.ORRS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.ORRS,
				this.lri
			],
			[
				this.LDRH,
				this.ofrp
			],
			[
				this.ORRS,
				this.ari
			],
			[
				this.LDRSB,
				this.ofrp
			],
			[
				this.ORRS,
				this.rri
			],
			[
				this.LDRSH,
				this.ofrp
			]
		],
		//1A
		[
			[
				this.MOV,
				this.lli
			],
			[
				this.MOV,
				this.llr
			],
			[
				this.MOV,
				this.lri
			],
			[
				this.MOV,
				this.lrr
			],
			[
				this.MOV,
				this.ari
			],
			[
				this.MOV,
				this.arr
			],
			[
				this.MOV,
				this.rri
			],
			[
				this.MOV,
				this.rrr
			],
			[
				this.MOV,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.MOV,
				this.lri
			],
			[
				this.STRH,
				this.prrp
			],
			[
				this.MOV,
				this.ari
			],
			[
				this.LDRD,
				this.prrp
			],
			[
				this.MOV,
				this.rri
			],
			[
				this.STRD,
				this.prrp
			]
		],
		//1B
		[
			[
				this.MOVS,
				this.lli
			],
			[
				this.MOVS,
				this.llr
			],
			[
				this.MOVS,
				this.lri
			],
			[
				this.MOVS,
				this.lrr
			],
			[
				this.MOVS,
				this.ari
			],
			[
				this.MOVS,
				this.arr
			],
			[
				this.MOVS,
				this.rri
			],
			[
				this.MOVS,
				this.rrr
			],
			[
				this.MOVS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.MOVS,
				this.lri
			],
			[
				this.LDRH,
				this.prrp
			],
			[
				this.MOVS,
				this.ari
			],
			[
				this.LDRSB,
				this.prrp
			],
			[
				this.MOVS,
				this.rri
			],
			[
				this.LDRSH,
				this.prrp
			]
		],
		//1C
		[
			[
				this.BIC,
				this.lli
			],
			[
				this.BIC,
				this.llr
			],
			[
				this.BIC,
				this.lri
			],
			[
				this.BIC,
				this.lrr
			],
			[
				this.BIC,
				this.ari
			],
			[
				this.BIC,
				this.arr
			],
			[
				this.BIC,
				this.rri
			],
			[
				this.BIC,
				this.rrr
			],
			[
				this.BIC,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.BIC,
				this.lri
			],
			[
				this.STRH,
				this.ofip
			],
			[
				this.BIC,
				this.ari
			],
			[
				this.LDRD,
				this.ofip
			],
			[
				this.BIC,
				this.rri
			],
			[
				this.STRD,
				this.ofip
			]
		],
		//1D
		[
			[
				this.BICS,
				this.lli
			],
			[
				this.BICS,
				this.llr
			],
			[
				this.BICS,
				this.lri
			],
			[
				this.BICS,
				this.lrr
			],
			[
				this.BICS,
				this.ari
			],
			[
				this.BICS,
				this.arr
			],
			[
				this.BICS,
				this.rri
			],
			[
				this.BICS,
				this.rrr
			],
			[
				this.BICS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.BICS,
				this.lri
			],
			[
				this.LDRH,
				this.ofip
			],
			[
				this.BICS,
				this.ari
			],
			[
				this.LDRSB,
				this.ofip
			],
			[
				this.BICS,
				this.rri
			],
			[
				this.LDRSH,
				this.ofip
			]
		],
		//1E
		[
			[
				this.MVN,
				this.lli
			],
			[
				this.MVN,
				this.llr
			],
			[
				this.MVN,
				this.lri
			],
			[
				this.MVN,
				this.lrr
			],
			[
				this.MVN,
				this.ari
			],
			[
				this.MVN,
				this.arr
			],
			[
				this.MVN,
				this.rri
			],
			[
				this.MVN,
				this.rrr
			],
			[
				this.MVN,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.MVN,
				this.lri
			],
			[
				this.STRH,
				this.prip
			],
			[
				this.MVN,
				this.ari
			],
			[
				this.LDRD,
				this.prip
			],
			[
				this.MVN,
				this.rri
			],
			[
				this.STRD,
				this.prip
			]
		],
		//1F
		[
			[
				this.MVNS,
				this.lli
			],
			[
				this.MVNS,
				this.llr
			],
			[
				this.MVNS,
				this.lri
			],
			[
				this.MVNS,
				this.lrr
			],
			[
				this.MVNS,
				this.ari
			],
			[
				this.MVNS,
				this.arr
			],
			[
				this.MVNS,
				this.rri
			],
			[
				this.MVNS,
				this.rrr
			],
			[
				this.MVNS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.MVNS,
				this.lri
			],
			[
				this.LDRH,
				this.prip
			],
			[
				this.MVNS,
				this.ari
			],
			[
				this.LDRSB,
				this.prip
			],
			[
				this.MVNS,
				this.rri
			],
			[
				this.LDRSH,
				this.prip
			]
		],
		//20
		this.generateLowMap(this.AND, this.imm),
		//21
		this.generateLowMap(this.ANDS, this.imm),
		//22
		this.generateLowMap(this.EOR, this.imm),
		//23
		this.generateLowMap(this.EORS, this.imm),
		//24
		this.generateLowMap(this.SUB, this.imm),
		//25
		this.generateLowMap(this.SUBS, this.imm),
		//26
		this.generateLowMap(this.RSB, this.imm),
		//27
		this.generateLowMap(this.RSBS, this.imm),
		//28
		this.generateLowMap(this.ADD, this.imm),
		//29
		this.generateLowMap(this.ADDS, this.imm),
		//2A
		this.generateLowMap(this.ADC, this.imm),
		//2B
		this.generateLowMap(this.ADCS, this.imm),
		//2C
		this.generateLowMap(this.SBC, this.imm),
		//2D
		this.generateLowMap(this.SBCS, this.imm),
		//2E
		this.generateLowMap(this.RSC, this.imm),
		//2F
		this.generateLowMap(this.RSCS, this.imm),
		//30
		this.generateLowMap(this.UNDEFINED, this.NOP),
		//31
		this.generateLowMap(this.TSTS, this.imm),
		//32
		this.generateLowMap(this.MSR, this.ic),
		//33
		this.generateLowMap(this.TEQS, this.imm),
		//34
		this.generateLowMap(this.UNDEFINED, this.NOP),
		//35
		this.generateLowMap(this.CMPS, this.imm),
		//36
		this.generateLowMap(this.MSR, this.is),
		//37
		this.generateLowMap(this.CMNS, this.imm),
		//38
		this.generateLowMap(this.ORR, this.imm),
		//39
		this.generateLowMap(this.ORRS, this.imm),
		//3A
		this.generateLowMap(this.MOV, this.imm),
		//3B
		this.generateLowMap(this.MOVS, this.imm),
		//3C
		this.generateLowMap(this.BIC, this.imm),
		//3D
		this.generateLowMap(this.BICS, this.imm),
		//3E
		this.generateLowMap(this.MVN, this.imm),
		//3F
		this.generateLowMap(this.MVNS, this.imm),
		//40
		this.generateLowMap(this.STR, this.ptim),
		//41
		this.generateLowMap(this.LDR, this.ptim),
		//42
		this.generateLowMap(this.STRT, this.ptim),
		//43
		this.generateLowMap(this.LDRT, this.ptim),
		//44
		this.generateLowMap(this.STRB, this.ptim),
		//45
		this.generateLowMap(this.LDRB, this.ptim),
		//46
		this.generateLowMap(this.STRBT, this.ptim),
		//47
		this.generateLowMap(this.LDRBT, this.ptim),
		//48
		this.generateLowMap(this.STR, this.ptip),
		//49
		this.generateLowMap(this.LDR, this.ptip),
		//4A
		this.generateLowMap(this.STRT, this.ptip),
		//4B
		this.generateLowMap(this.LDRT, this.ptip),
		//4C
		this.generateLowMap(this.STRB, this.ptip),
		//4D
		this.generateLowMap(this.LDRB, this.ptip),
		//4E
		this.generateLowMap(this.STRBT, this.ptip),
		//4F
		this.generateLowMap(this.LDRBT, this.ptip),
		//50
		this.generateLowMap(this.STR, this.ofim),
		//51
		this.generateLowMap(this.LDR, this.ofim),
		//52
		this.generateLowMap(this.STR, this.prim),
		//53
		this.generateLowMap(this.LDR, this.prim),
		//54
		this.generateLowMap(this.STRB, this.ofim),
		//55
		this.generateLowMap(this.LDRB, this.ofim),
		//56
		this.generateLowMap(this.STRB, this.prim),
		//57
		this.generateLowMap(this.LDRB, this.prim),
		//58
		this.generateLowMap(this.STR, this.ofip),
		//59
		this.generateLowMap(this.LDR, this.ofip),
		//5A
		this.generateLowMap(this.STR, this.prip),
		//5B
		this.generateLowMap(this.LDR, this.prip),
		//5C
		this.generateLowMap(this.STRB, this.ofip),
		//5D
		this.generateLowMap(this.LDRB, this.ofip),
		//5E
		this.generateLowMap(this.STRB, this.prip),
		//5F
		this.generateLowMap(this.LDRB, this.prip),
	];
	//60-6F
	this.generateStoreLoadInstructionSector1();
	//70-7F
	this.generateStoreLoadInstructionSector2();
	this.instructionMap = this.instructionMap.concat([
		//80
		this.generateLowMap(this.STMDA, this.NOP),
		//81
		this.generateLowMap(this.LDMDA, this.NOP),
		//82
		this.generateLowMap(this.STMDA, this.w),
		//83
		this.generateLowMap(this.LDMDA, this.w),
		//84
		this.generateLowMap(this.STMDA, this.u),
		//85
		this.generateLowMap(this.LDMDA, this.u),
		//86
		this.generateLowMap(this.STMDA, this.u | this.w),
		//87
		this.generateLowMap(this.LDMDA, this.u | this.w),
		//88
		this.generateLowMap(this.STMIA, this.NOP),
		//89
		this.generateLowMap(this.LDMIA, this.NOP),
		//8A
		this.generateLowMap(this.STMIA, this.w),
		//8B
		this.generateLowMap(this.LDMIA, this.w),
		//8C
		this.generateLowMap(this.STMIA, this.u),
		//8D
		this.generateLowMap(this.LDMIA, this.u),
		//8E
		this.generateLowMap(this.STMIA, this.u | this.w),
		//8F
		this.generateLowMap(this.LDMIA, this.u | this.w),
		//90
		this.generateLowMap(this.STMDB, this.NOP),
		//91
		this.generateLowMap(this.LDMDB, this.NOP),
		//92
		this.generateLowMap(this.STMDB, this.w),
		//93
		this.generateLowMap(this.LDMDB, this.w),
		//94
		this.generateLowMap(this.STMDB, this.u),
		//95
		this.generateLowMap(this.LDMDB, this.u),
		//96
		this.generateLowMap(this.STMDB, this.u | this.w),
		//97
		this.generateLowMap(this.LDMDB, this.u | this.w),
		//98
		this.generateLowMap(this.STMIB, this.NOP),
		//99
		this.generateLowMap(this.LDMIB, this.NOP),
		//9A
		this.generateLowMap(this.STMIB, this.w),
		//9B
		this.generateLowMap(this.LDMIB, this.w),
		//9C
		this.generateLowMap(this.STMIB, this.u),
		//9D
		this.generateLowMap(this.LDMIB, this.u),
		//9E
		this.generateLowMap(this.STMIB, this.u | this.w),
		//9F
		this.generateLowMap(this.LDMIB, this.u | this.w),
		//A0
		this.generateLowMap(this.B, this.NOP),
		//A1
		this.generateLowMap(this.B, this.NOP),
		//A2
		this.generateLowMap(this.B, this.NOP),
		//A3
		this.generateLowMap(this.B, this.NOP),
		//A4
		this.generateLowMap(this.B, this.NOP),
		//A5
		this.generateLowMap(this.B, this.NOP),
		//A6
		this.generateLowMap(this.B, this.NOP),
		//A7
		this.generateLowMap(this.B, this.NOP),
		//A8
		this.generateLowMap(this.B, this.NOP),
		//A9
		this.generateLowMap(this.B, this.NOP),
		//AA
		this.generateLowMap(this.B, this.NOP),
		//AB
		this.generateLowMap(this.B, this.NOP),
		//AC
		this.generateLowMap(this.B, this.NOP),
		//AD
		this.generateLowMap(this.B, this.NOP),
		//AE
		this.generateLowMap(this.B, this.NOP),
		//AF
		this.generateLowMap(this.B, this.NOP),
		//B0
		this.generateLowMap(this.BL, this.NOP),
		//B1
		this.generateLowMap(this.BL, this.NOP),
		//B2
		this.generateLowMap(this.BL, this.NOP),
		//B3
		this.generateLowMap(this.BL, this.NOP),
		//B4
		this.generateLowMap(this.BL, this.NOP),
		//B5
		this.generateLowMap(this.BL, this.NOP),
		//B6
		this.generateLowMap(this.BL, this.NOP),
		//B7
		this.generateLowMap(this.BL, this.NOP),
		//B8
		this.generateLowMap(this.BL, this.NOP),
		//B9
		this.generateLowMap(this.BL, this.NOP),
		//BA
		this.generateLowMap(this.BL, this.NOP),
		//BB
		this.generateLowMap(this.BL, this.NOP),
		//BC
		this.generateLowMap(this.BL, this.NOP),
		//BD
		this.generateLowMap(this.BL, this.NOP),
		//BE
		this.generateLowMap(this.BL, this.NOP),
		//BF
		this.generateLowMap(this.BL, this.NOP),
		//C0
		this.generateLowMap(this.STC, this.ofm),
		//C1
		this.generateLowMap(this.LDC, this.ofm),
		//C2
		this.generateLowMap(this.STC, this.prm),
		//C3
		this.generateLowMap(this.LDC, this.prm),
		//C4
		this.generateLowMap(this.STC, this.ofm),
		//C5
		this.generateLowMap(this.LDC, this.ofm),
		//C6
		this.generateLowMap(this.STC, this.prm),
		//C7
		this.generateLowMap(this.LDC, this.prm),
		//C8
		this.generateLowMap(this.STC, this.ofp),
		//C9
		this.generateLowMap(this.LDC, this.ofp),
		//CA
		this.generateLowMap(this.STC, this.prp),
		//CB
		this.generateLowMap(this.LDC, this.prp),
		//CC
		this.generateLowMap(this.STC, this.ofp),
		//CD
		this.generateLowMap(this.LDC, this.ofp),
		//CE
		this.generateLowMap(this.STC, this.prp),
		//CF
		this.generateLowMap(this.LDC, this.prp),
		//D0
		this.generateLowMap(this.STC, this.unm),
		//D1
		this.generateLowMap(this.LDC, this.unm),
		//D2
		this.generateLowMap(this.STC, this.ptm),
		//D3
		this.generateLowMap(this.LDC, this.ptm),
		//D4
		this.generateLowMap(this.STC, this.unm),
		//D5
		this.generateLowMap(this.LDC, this.unm),
		//D6
		this.generateLowMap(this.STC, this.ptm),
		//D7
		this.generateLowMap(this.LDC, this.ptm),
		//D8
		this.generateLowMap(this.STC, this.unp),
		//D9
		this.generateLowMap(this.LDC, this.unp),
		//DA
		this.generateLowMap(this.STC, this.ptp),
		//DB
		this.generateLowMap(this.LDC, this.ptp),
		//DC
		this.generateLowMap(this.STC, this.unp),
		//DD
		this.generateLowMap(this.LDC, this.unp),
		//DE
		this.generateLowMap(this.STC, this.ptp),
		//DF
		this.generateLowMap(this.LDC, this.ptp),
		//E0
		this.generateLowMap2(this.CDP, this.MCR),
		//E1
		this.generateLowMap2(this.CDP, this.MRC),
		//E2
		this.generateLowMap2(this.CDP, this.MCR),
		//E3
		this.generateLowMap2(this.CDP, this.MRC),
		//E4
		this.generateLowMap2(this.CDP, this.MCR),
		//E5
		this.generateLowMap2(this.CDP, this.MRC),
		//E6
		this.generateLowMap2(this.CDP, this.MCR),
		//E7
		this.generateLowMap2(this.CDP, this.MRC),
		//E8
		this.generateLowMap2(this.CDP, this.MCR),
		//E9
		this.generateLowMap2(this.CDP, this.MRC),
		//EA
		this.generateLowMap2(this.CDP, this.MCR),
		//EB
		this.generateLowMap2(this.CDP, this.MRC),
		//EC
		this.generateLowMap2(this.CDP, this.MCR),
		//ED
		this.generateLowMap2(this.CDP, this.MRC),
		//EE
		this.generateLowMap2(this.CDP, this.MCR),
		//EF
		this.generateLowMap2(this.CDP, this.MRC),
		//F0
		this.generateLowMap(this.SWI, this.NOP),
		//F1
		this.generateLowMap(this.SWI, this.NOP),
		//F2
		this.generateLowMap(this.SWI, this.NOP),
		//F3
		this.generateLowMap(this.SWI, this.NOP),
		//F4
		this.generateLowMap(this.SWI, this.NOP),
		//F5
		this.generateLowMap(this.SWI, this.NOP),
		//F6
		this.generateLowMap(this.SWI, this.NOP),
		//F7
		this.generateLowMap(this.SWI, this.NOP),
		//F8
		this.generateLowMap(this.SWI, this.NOP),
		//F9
		this.generateLowMap(this.SWI, this.NOP),
		//FA
		this.generateLowMap(this.SWI, this.NOP),
		//FB
		this.generateLowMap(this.SWI, this.NOP),
		//FC
		this.generateLowMap(this.SWI, this.NOP),
		//FD
		this.generateLowMap(this.SWI, this.NOP),
		//FE
		this.generateLowMap(this.SWI, this.NOP),
		//FF
		this.generateLowMap(this.SWI, this.NOP)
	]);
}
ARMInstructionSet.prototype.generateLowMap = function (instructionOpcode, dataOpcode) {
	return [
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		],
		[
			instructionOpcode,
			dataOpcode
		]
	];
}
ARMInstructionSet.prototype.generateLowMap2 = function (instructionOpcode, instructionOpcode2) {
	return [
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		],
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		],
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		],
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		],
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		],
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		],
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		],
		[
			instructionOpcode,
			this.NOP
		],
		[
			instructionOpcode2,
			this.NOP
		]
	];
}
ARMInstructionSet.prototype.generateStoreLoadInstructionSector1 = function () {
	var instrMap = [
		this.STR,
		this.LDR,
		this.STRT,
		this.LDRT,
		this.STRB,
		this.LDRB,
		this.STRBT,
		this.LDRBT
	];
	var dataMap = [
		this.ptrmll,
		this.ptrmlr,
		this.ptrmar,
		this.ptrmrr
	];
	for (var instrIndex = 0; instrIndex < 0x10; ++instrIndex) {
		var lowMap = [];
		for (var dataIndex = 0; dataIndex < 0x10; ++dataIndex) {
			if ((dataIndex & 0x1) == 0) {
				lowMap.push([
					instrMap[instrIndex & 0x7],
					dataMap[(dataIndex >> 1) & 0x3]
				]);
			}
			else {
				lowMap.push([
					this.UNDEFINED,
					this.NOP
				]);
			}
		}
		this.instructionMap.push(lowMap);
	}
}
ARMInstructionSet.prototype.generateStoreLoadInstructionSector2 = function () {
	var instrMap = [
		this.STR,
		this.LDR,
		this.STR,
		this.LDR,
		this.STRB,
		this.LDRB,
		this.STRB,
		this.LDRB,
	];
	var dataMap = [
		[
			this.ofrmll,
			this.ofrmlr,
			this.ofrmar,
			this.ofrmrr
		],
		[
			this.prrmll,
			this.prrmlr,
			this.prrmar,
			this.prrmrr
		],
		[
			this.ofrpll,
			this.ofrplr,
			this.ofrpar,
			this.ofrprr
		],
		[
			this.prrpll,
			this.prrplr,
			this.prrpar,
			this.prrprr
		]
	];
	for (var instrIndex = 0; instrIndex < 0x10; ++instrIndex) {
		var lowMap = [];
		for (var dataIndex = 0; dataIndex < 0x10; ++dataIndex) {
			if ((dataIndex & 0x1) == 0) {
				lowMap.push([
					instrMap[instrIndex & 0x7],
					dataMap[((instrIndex & 0x8)  >> 2) | ((instrIndex & 0x3) >> 1)][(dataIndex >> 1) & 0x3]
				]);
			}
			else {
				lowMap.push([
					this.UNDEFINED,
					this.NOP
				]);
			}
		}
		this.instructionMap.push(lowMap);
	}
}