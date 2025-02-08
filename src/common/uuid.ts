var Base64KeyChars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var AsciiTo64 = new Array(128);
for (var i = 0; i < 128; ++i) {
    AsciiTo64[i] = 0;
}
for (var i = 0; i < 64; ++i) {
    AsciiTo64[Base64KeyChars.charCodeAt(i)] = i;
}
export const COMPRESSED_UUID_RE = /^[0-9a-zA-Z+/]{22,23}$/;

export const LONG_UUID_RE = /^\w{8}-\w{4}-4\w{3}-\w{4}-\w{12}$/;

export function isUUID(str: string) {
    return COMPRESSED_UUID_RE.test(str) || LONG_UUID_RE.test(str);
}
export function createUUID() {
    /* jshint ignore:start */
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7) | 0x8).toString(16);
        }
    );
    return compressUUID(uuid);
    /* jshint ignore:end */
}

export function decompressUUID(i: string) {
    if (23 === i.length) {
        var e = [];
        for (var r = 5; r < 23; r += 2) {
            var s = AsciiTo64[i.charCodeAt(r)],
                t = AsciiTo64[i.charCodeAt(r + 1)];
            e.push((s >> 2).toString(16));
            e.push((((3 & s) << 2) | (t >> 4)).toString(16));
            e.push((15 & t).toString(16));
        }
        i = i.slice(0, 5) + e.join('');
    } else if (22 === i.length) {
        var e = [];
        for (var r = 2; r < 22; r += 2) {
            var s = AsciiTo64[i.charCodeAt(r)],
                t = AsciiTo64[i.charCodeAt(r + 1)];
            e.push((s >> 2).toString(16));
            e.push((((3 & s) << 2) | (t >> 4)).toString(16));
            e.push((15 & t).toString(16));
        }
        i = i.slice(0, 2) + e.join('');
    }
    return [
        i.slice(0, 8),
        i.slice(8, 12),
        i.slice(12, 16),
        i.slice(16, 20),
        i.slice(20),
    ].join('-');
}
export function compressUUID(uuid: string) {
    uuid = uuid.replace(/-/g, '');
    var r = 5;
    var len = uuid.length;
    var o = [];
    var t = uuid.slice(0, r);
    while (r < len) {
        var u = parseInt(uuid[r], 16);
        var a = parseInt(uuid[r + 1], 16);
        var d = parseInt(uuid[r + 2], 16);
        o.push(Base64KeyChars[(u << 2) | (a >> 2)]);
        o.push(Base64KeyChars[((3 & a) << 4) | d]);
        r += 3;
    }
    return t + o.join('');
}
export function isValidUUID(uuid: string) {
    if (LONG_UUID_RE.test(uuid)) {
        return true;
    }
    return LONG_UUID_RE.test(uuid) || LONG_UUID_RE.test(decompressUUID(uuid));
}
export function getNewUUID(uuid: string, prefix: string) {
    if (LONG_UUID_RE.test(uuid)) {
        return uuid.replace(/^.{8}(.*)$/, ''.concat(prefix, '$1'));
    } else if (COMPRESSED_UUID_RE.test(uuid)) {
        return compressUUID(
            decompressUUID(uuid).replace(/^.{8}(.*)$/, ''.concat(prefix, '$1'))
        );
    }
    return uuid;
}
