"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.binaryNodeToString = exports.getBinaryNodeMessages = exports.reduceBinaryNodeToDictionary = exports.assertNodeErrorFree = exports.getBinaryNodeChildUInt = exports.getBinaryNodeChildString = exports.getBinaryNodeChildBuffer = exports.getBinaryNodeChild = exports.getAllBinaryNodeChildren = exports.getBinaryNodeChildren = void 0;
const boom_1 = require("@hapi/boom");
const WAProto_1 = require("../../WAProto");
const Utils_1 = require("../Utils")
// some extra useful utilities
const getBinaryNodeChildren = (node, childTag) => {
    if (Array.isArray(node === null || node === void 0 ? void 0 : node.content)) {
        return node.content.filter(item => item.tag === childTag);
    }
    return [];
};
exports.getBinaryNodeChildren = getBinaryNodeChildren;
const getAllBinaryNodeChildren = ({ content }) => {
    if (Array.isArray(content)) {
        return content;
    }
    return [];
};
exports.getAllBinaryNodeChildren = getAllBinaryNodeChildren;
const getBinaryNodeChild = (node, childTag) => {
    if (Array.isArray(node === null || node === void 0 ? void 0 : node.content)) {
        return node === null || node === void 0 ? void 0 : node.content.find(item => item.tag === childTag);
    }
};
exports.getBinaryNodeChild = getBinaryNodeChild;
const getBinaryNodeChildBuffer = (node, childTag) => {
    var _a;
    const child = (_a = (0, exports.getBinaryNodeChild)(node, childTag)) === null || _a === void 0 ? void 0 : _a.content;
    if (Buffer.isBuffer(child) || child instanceof Uint8Array) {
        return child;
    }
};
exports.getBinaryNodeChildBuffer = getBinaryNodeChildBuffer;
const getBinaryNodeChildString = (node, childTag) => {
    var _a;
    const child = (_a = (0, exports.getBinaryNodeChild)(node, childTag)) === null || _a === void 0 ? void 0 : _a.content;
    if (Buffer.isBuffer(child) || child instanceof Uint8Array) {
        return Buffer.from(child).toString('utf-8');
    }
    else if (typeof child === 'string') {
        return child;
    }
};
exports.getBinaryNodeChildString = getBinaryNodeChildString;
const getBinaryNodeChildUInt = (node, childTag, length) => {
    const buff = (0, exports.getBinaryNodeChildBuffer)(node, childTag);
    if (buff) {
        return bufferToUInt(buff, length);
    }
};
exports.getBinaryNodeChildUInt = getBinaryNodeChildUInt;
const assertNodeErrorFree = (node) => {
    const errNode = (0, exports.getBinaryNodeChild)(node, 'error');
    if (errNode) {
        throw new boom_1.Boom(errNode.attrs.text || 'Unknown error', { data: +errNode.attrs.code });
    }
};
exports.assertNodeErrorFree = assertNodeErrorFree;
const reduceBinaryNodeToDictionary = (node, tag) => {
    const nodes = (0, exports.getBinaryNodeChildren)(node, tag);
    const dict = nodes.reduce((dict, { attrs }) => {
        dict[attrs.name || attrs.config_code] = attrs.value || attrs.config_value;
        return dict;
    }, {});
    return dict;
};
exports.reduceBinaryNodeToDictionary = reduceBinaryNodeToDictionary;
const getBinaryNodeMessages = ({ content }) => {
    const msgs = [];
    if (Array.isArray(content)) {
        for (const item of content) {
            if (item.tag === 'message') {
                msgs.push(WAProto_1.proto.WebMessageInfo.decode(item.content));
            }
        }
    }
    return msgs;
};
exports.getBinaryNodeMessages = getBinaryNodeMessages;
function bufferToUInt(e, t) {
    let a = 0;
    for (let i = 0; i < t; i++) {
        a = 256 * a + e[i];
    }
    return a;
}
const tabs = (n) => '\t'.repeat(n);
function binaryNodeToString(node, i = 0) {
    if (!node) {
        return node;
    }
    if (typeof node === 'string') {
        return tabs(i) + node;
    }
    if (node instanceof Uint8Array) {
        return tabs(i) + Buffer.from(node).toString('hex');
    }
    if (Array.isArray(node)) {
        return node.map((x) => tabs(i + 1) + binaryNodeToString(x, i + 1)).join('\n');
    }
    const children = binaryNodeToString(node.content, i + 1);
    const tag = `<${node.tag} ${Object.entries(node.attrs || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}='${v}'`)
        .join(' ')}`;
    const content = children ? `>\n${children}\n${tabs(i)}</${node.tag}>` : '/>';
    return tag + content;
}
exports.binaryNodeToString = binaryNodeToString;
const getBinaryFilteredBizBot = (nodeContent) => {
    if (!Array.isArray(nodeContent)) return false 

    return nodeContent.some(b => 
        ['bot'].includes(b?.tag) && b?.attrs?.biz_bot === '1'
    ) 
}
exports.getBinaryFilteredBizBot = getBinaryFilteredBizBot;
const getBinaryNodeFilter = (node) => {
   if (!Array.isArray(node)) return false
   
   return node.some(item => 
      ['native_flow'].includes(item?.content?.[0]?.content?.[0]?.tag) ||
      ['interactive', 'buttons', 'list'].includes(item?.content?.[0]?.tag) ||
      ['hsm', 'biz'].includes(item?.tag) ||
      ['bot'].includes(item?.tag) && item?.attrs?.biz_bot === '1'
   )
}
exports.getBinaryNodeFilter = getBinaryNodeFilter;
const getAdditionalNode = (name) => {
   if (name) name = name.toLowerCase()
   const ts = Utils_1.unixTimestampSeconds(new Date()) - 77980457
   
   const flow_name = {
      cta_catalog: 'cta_catalog',
      mpm: 'mpm',
      call_request: 'call_permission_request',
      view_catalog: 'automated_greeting_message_view_catalog',
      wa_pay_detail: 'wa_payment_transaction_details',
      send_location: 'send_location',
   }
   
   if (flow_name[name] || name === 'interactive' || name === 'buttons') {
       return [{
           tag: 'biz',
           attrs: { 
               actual_actors: '2',
               host_storage: '2',
               privacy_mode_ts: `${ts}`
           },
           content: [{
               tag: 'engagement',
               attrs: {
                   customer_service_state: 'open',
                   conversation_state: 'open'
               }
           }, {
               tag: 'interactive',
               attrs: {
                   type: 'native_flow',
                   v: '1'
               },
               content: [{
                   tag: 'native_flow',
                   attrs: { 
                       v: '9',
                       name: flow_name[name] ?? 'mixed',
                   },
                       content: []
                   }]
               }]
           }]
   } else {
         return [{
         tag: 'biz',
         attrs: {
            actual_actors: '2',
            host_storage: '2',
            privacy_mode_ts: `${ts}`
         },
         content: [{
            tag: 'engagement',
            attrs: {
               customer_service_state: 'open',
               conversation_state: 'open'
            }
         }]
      }]
   }
}
exports.getAdditionalNode = getAdditionalNode;

