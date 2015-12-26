/**
 * @module  audio-buffer-utils
 */


var AudioBuffer = require('audio-buffer');


module.exports = {
    compatible: compatible,
    clone: clone,
    reverse: reverse,
    invert: invert,
    zero: zero,
    noise: noise,
    equal: equal,
    fill: fill,
    slice: slice,
    map: map,
    concat: concat,
    resize: resize,
    rotate: rotate,
    shift: shift
};

/**
 * Create a buffer with the same characteristics as inBuffer, without copying
 * the data. Contents of resulting buffer are undefined.
 */
function compatible (inBuffer) {
    return new AudioBuffer(inBuffer.numberOfChannels, inBuffer.length, inBuffer.sampleRate);
}


/**
 * Create clone of a buffer
 */
function clone (inBuffer) {
    return new AudioBuffer(inBuffer);
}


/**
 * Reverse samples in each channel
 */
function reverse (buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i);
        Array.prototype.reverse.call(d);
    }

    return buffer;
}


/**
 * Invert amplitude of samples in each channel
 */
function invert (buffer) {
    return fill(buffer, function (sample) { return -sample; });
}


/**
 * Fill with zeros
 */
function zero (buffer) {
    return fill(buffer, 0);
}


/**
 * Fill with white noise
 */
function noise (buffer) {
    return fill(buffer, function (sample) { return Math.random() * 2 - 1; });
}


/**
 * Test whether two buffers are the same
 */
function equal (bufferA, bufferB) {
    //walk by all the arguments
    if (arguments.length > 2) {
        for (var i = 0, l = arguments.length - 1; i < l; i++) {
            if (!equal(arguments[i], arguments[i + 1])) return false;
        }
        return true;
    }

    if (bufferA.length !== bufferB.length || bufferA.numberOfChannels !== bufferB.numberOfChannels) return false;

    for (var channel = 0; channel < bufferA.numberOfChannels; channel++) {
        var dataA = bufferA.getChannelData(channel);
        var dataB = bufferB.getChannelData(channel);

        for (var i = 0; i < dataA.length; i++) {
            if (dataA[i] !== dataB[i]) return false;
        }
    }

    return true;
}


/**
 * Generic fill
 */
function fill (buffer, fn) {
    var isFn = fn instanceof Function;

    for (var channel = 0, c = buffer.numberOfChannels; channel < c; ++channel) {
        var data = buffer.getChannelData(channel),
            l = buffer.length;
        if (isFn) {
            for (var i = 0; i < l; i++) {
                data[i] = fn.call(buffer, data[i], channel, i, data);
            }
        }
        else while (l--) data[l] = fn;
    }

    return buffer;
}


/**
 * Return sliced buffer
 */
function slice (buffer, start, end) {
    var data = [];
    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
        data.push(buffer.getChannelData(channel).slice(start, end));
    }
    return new AudioBuffer(buffer.numberOfChannels, data, buffer.sampleRate);
}


/**
 * Return new buffer, mapped by a function.
 * Similar to fill, but keeps initial buffer untouched
 */
//WISH: itd be nice to be able to mix channels, apply effects (basically operator processors)
function map (buffer, fn) {
    var data = [];

    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
        data.push(buffer.getChannelData(channel).map(function (value, idx) {
            return fn.call(buffer, value, channel, idx, data);
        }));
    }

    return new AudioBuffer(buffer.numberOfChannels, data, buffer.sampleRate);
}


/**
 * Concat buffer with other buffer(s)
 */
function concat (bufferA, bufferB) {
    //walk by all the arguments
    if (arguments.length > 2) {
        var result = bufferA;
        for (var i = 1, l = arguments.length; i < l; i++) {
            result = concat(result, arguments[i]);
        }
        return result;
    }

    var data = [];
    var channels = Math.max(bufferA.numberOfChannels, bufferB.numberOfChannels);
    var length = bufferA.length + bufferB.length;

    //FIXME: there might be required more thoughtful resampling, but now I'm lazy sry :(
    var sampleRate = Math.max(bufferA.sampleRate, bufferB.sampleRate);

    for (var channel = 0; channel < channels; channel++) {
        var channelData = new Float32Array(length);

        if (channel < bufferA.numberOfChannels) {
            channelData.set(bufferA.getChannelData(channel));
        }

        if (channel < bufferB.numberOfChannels) {
            channelData.set(bufferB.getChannelData(channel), bufferA.length);
        }

        data.push(channelData);
    }

    return new AudioBuffer(channels, data, sampleRate);
}


/**
 * Change the length of the buffer, by trimming or filling with zeros
 */
function resize (buffer, length) {
    if (length < buffer.length) return slice(buffer, 0, length);

    return concat(buffer, new AudioBuffer(length - buffer.length));
}



/**
 * Shift content of the buffer in circular fashion
 */
function rotate (buffer, offset) {
    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
        var cData = buffer.getChannelData(channel);
        var srcData = cData.slice();
        for (var i = 0, l = cData.length, idx; i < l; i++) {
            idx = (offset + (offset + i < 0 ? l + i : i )) % l;
            cData[idx] = srcData[i];
        }
    }
    return buffer;
}


/**
 * Shift content of the buffer
 */
function shift (buffer, offset) {
    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
        var cData = buffer.getChannelData(channel);
        if (offset > 0) {
            for (var i = cData.length - offset; i--;) {
                cData[i + offset] = cData[i];
            }
        }
        else {
            for (var i = -offset, l = cData.length - offset; i < l; i++) {
                cData[i + offset] = cData[i] || 0;
            }
        }
    }
    return buffer;
}



/**
 * Change sample rate
 */
function resample (buffer, sampleRate) {
    xxx
}


/**
 * Return buffer, pointing to the current one
 */
function sub (buffer, start, end) {
    xxx
}


/**
 * Stretch or slow down the signal by the factor
 */
function scale (buffer, factor) {
    xxx
}


/**
 * Change map of channels.
 * Pass an optional flag to upmix/downmix according to the rules
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#Up-mixing_and_down-mixing
 */
function remap (buffer, chanels, remix) {
    xxx
}


/**
 * Get frequencies content of the buffer
 */
function fft (buffer) {
    xxx
}

/**
 * Get buffer from frequencies content
 */
function ifft (buffer) {
    xxx
}


/**
 * Reduce buffer to a single metric, e. g. average, max, min, volume etc
 */
function reduce (buffer, fn) {
    xxx
}


/**
 * Normalize buffer by the maximum value
 */
function normalize (buffer) {
    xxx
}


/**
 * Trim sound (remove zeros from the beginning and the end)
 */
function trim (buffer, level) {
    xxx
}


/**
 * Get the loudness of the buffer, acc to the spec
 * https://tech.ebu.ch/docs/r/r128.pdf
 */
function loudness (buffer) {
    xxx
}


/**
 * Mix current buffer with the other one
 */
function mix (buffer, bufferB) {
   xxx
}


/**
 * Size of a buffer, in megabytes
 */
function size (buffer) {
    xxx
}