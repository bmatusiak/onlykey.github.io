var userDict = {}           // UserId -> KeyHandle
var keyHandleDict = {};     // KeyHandle -> PublicKey
var hw_RNG = {};

var appId = window.location.origin;
var version = "U2F_V2";
var OKversion;

var p256 = new ECC('p256');
var sha256 = function(s) { return p256.hash().update(s).digest(); };
var BN = p256.n.constructor;  // BN = BigNumber

var curve25519 = new ECC('curve25519');
var appKey;
var appPub;
var appPubPart;
var okPub;
var sharedsec;

var pin;
var poll_type, poll_delay;
var custom_keyid;
var msgType;
var keySlot;
var counter = 0;
var encrypted_data;
const OKDECRYPT = 240;
const OKSIGN = 237;
const OKSETTIME = 228;
const OKGETPUBKEY = 236;
const OKGETRESPONSE = 242;
const OKPING = 243;

/**
 * Initializes OnlyKey
 * Performs NACL key exchange to encrypt all future packets
 * Receives hardware generated entropy for future use
 */
async function init() {
  await msg_polling({ type: 1, delay: 0 }); //Set time on OnlyKey, get firmware version, get ecc public
}

/**
 * U2F registration pure JavaScript
 */
function enroll_local() {
  msg("Enrolling user " + userId());
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "appId": appId, "version": version};
  u2f.register(appId, [req], [], function(response) {
    var result = process_enroll_response(response);
    msg("User " + userId() + " enroll " + (result ? "succeeded" : "failed"));
  });
}

/**
 * U2F authentication pure JavaScript
 */
function auth_local() {
  msg("Authorizing user " + userId());
  keyHandle = userDict[userId()];
  if (!keyHandle) {
    msg("User " + userId() + " not enrolled");
    return;
  }
  msg("Sending Handlekey " + keyHandle);
  var challenge = mkchallenge();
  msg("Sending challenge " + challenge);
  var req = { "challenge": challenge, "keyHandle": keyHandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], function(response) {
    var result = process_auth_response(response);
    msg("User " + userId() + " auth " + (result ? "succeeded" : "failed"));
  });
    msg("Finsihed");
}

/**
 * Function to process U2F registration response
 * @param {Array} response
 */
function process_enroll_response(response) {
  var err = response['errorCode'];
  if (err) {
    msg("Registration failed with error code " + err);
    console.info(errMes);
    return false;
  }
  var clientData_b64 = response['clientData'];
  var regData_b64 = response['registrationData'];
  var clientData_str = u2f_unb64(clientData_b64);
  var clientData = JSON.parse(clientData_str);
  var origin = clientData['origin'];
  if (origin != appId) {
    msg("Registration failed.  AppId was " + origin + ", should be " + appId);
    return false;
  }
  var v = string2bytes(u2f_unb64(regData_b64));
  var u2f_pk = v.slice(1, 66);                // PK = Public Key
  var kh_bytes = v.slice(67, 67 + v[66]);     // KH = Key Handle
  var kh_b64 = bytes2b64(kh_bytes);
  var cert_der = v.slice(67 + v[66]);
  var cert_asn1 = ASN1.decode(cert_der);
  var cert_pk_asn1 = cert_asn1.sub[0].sub[6].sub[1];
  var cert_pk_bytes = asn1bytes(cert_pk_asn1);
  var cert_key = p256.keyFromPublic(cert_pk_bytes.slice(3), 'der');
  var sig = cert_der.slice(cert_asn1.length + cert_asn1.header);
  var l = [[0], sha256(appId), sha256(clientData_str), kh_bytes, u2f_pk];
  var v = cert_key.verify(sha256(bcat(l)), sig);
  if (v) {
    userDict[userId()] = kh_b64;
    keyHandleDict[kh_b64] = u2f_pk;
  }
  return v;
}

/**
 * Function to process U2F sign response
 * @param {Array} response
 */
function process_auth_response(response) {
  console.info("Response", response);
  var err = response['errorCode'];
  if (err) {
    msg("Auth failed with error code " + err);
    console.info(errMes);
    return false;
  }
  var clientData_b64 = response['clientData'];
  var clientData_str = u2f_unb64(clientData_b64);
  var clientData_bytes = string2bytes(clientData_str);
  var clientData = JSON.parse(clientData_str);
  var origin = clientData['origin'];
  var kh = response['keyHandle'];
  var pk = keyHandleDict[kh];
  var key = p256.keyFromPublic(pk, 'der');
  var sigData = string2bytes(u2f_unb64(response['signatureData']));
  var sig = sigData.slice(5);
  var appid = document.location.origin;
  var m = bcat([sha256(appid), sigData.slice(0,5), sha256(clientData_bytes)]);
  if (!key.verify(sha256(m), sig)) return false;
  var userPresent = sigData[0];
  var counter2 = new BN(sigData.slice(1,5)).toNumber();
  msg("User present: " + userPresent);
  msg("Counter: " + counter2);
  return true;
}

/**
 * Use promise and setTimeout to wait x seconds
 */
let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Request response from OnlyKey using U2F authentication message
 * @param {number} params.delay
 * Number of seconds to delay before requesting response
 * @param {number} params.type
 * Type of response requested - OKSETTIME, OKGETPUBKEY, OKSIGN, OKDECRYPT
 */
async function msg_polling(params = {}, cb) {
  var delay = params.delay || 0;
  var type = params.type || 1; // default type to 1
  await wait(delay*1000);
  msg("Requesting response from OnlyKey");
  if (type == 1) { //OKSETTIME
    var message = [255, 255, 255, 255, OKSETTIME]; //Same header and message type used in App
    var currentEpochTime = Math.round(new Date().getTime() / 1000.0).toString(16);
    msg("Setting current time on OnlyKey to " + new Date());
    var timePart = currentEpochTime.match(/.{2}/g).map(hexStrToDec);
    var empty = new Array(23).fill(0);
    Array.prototype.push.apply(message, timePart);
    appKey = nacl.box.keyPair();
    console.info(appKey);
    console.info(appKey.publicKey);
    console.info(appKey.secretKey);
    console.info("Application ECDH Public Key: ", appKey.publicKey);
    Array.prototype.push.apply(message, appKey.publicKey);
    Array.prototype.push.apply(message, empty);
    var b64keyhandle = bytes2b64(message);
    counter = 0;
  } else if (type == 2) { //OKGETPUB
      var message = [255, 255, 255, 255, OKGETPUBKEY]; //Add header and message type
      msg("Checking to see if this key is assigned to an OnlyKey Slot " + custom_keyid);
      var empty = new Array(50).fill(0);
      Array.prototype.push.apply(message, custom_keyid);
      Array.prototype.push.apply(message, empty);
      while (message.length < 64) message.push(0);
      var encryptedkeyHandle = await aesgcm_encrypt(message);
      var b64keyhandle = bytes2b64(encryptedkeyHandle);
  } else { //Ping and get Response From OKSIGN or OKDECRYPT
      if (_status == 'done_challenge') counter++;
      if (_status == 'finished') return encrypted_data;
      console.info("Sending Ping Request to OnlyKey");
      var message = [255, 255, 255, 255]; //Add header and message type
      var ciphertext = new Uint8Array(60).fill(0);
      ciphertext[0] = (OKPING);
      Array.prototype.push.apply(message, ciphertext);
      while (message.length < 64) message.push(0);
      var encryptedkeyHandle = await aesgcm_encrypt(message);
      var b64keyhandle = bytes2b64(encryptedkeyHandle);
      _setStatus('waiting_ping');
  }
  var challenge = mkchallenge();
  var req = { "challenge": challenge, "keyHandle": b64keyhandle,
               "appId": appId, "version": version };
  u2f.sign(appId, challenge, [req], async function(response) {
    var result = await custom_auth_response(response);
    var data = await Promise;
    if (_status === 'finished') {
      console.info("Finished");
    } else if (_status === 'waiting_ping') {
      console.info("Ping Successful");
      _setStatus('pending_challenge');
      data = 1;
    }
    if (result == 2) {
        msg("Polling succeeded but no data was received");
        data = 1;
    } else if (result <= 5) {
      data = 1;
    }
    if (type == 1) {
      if (result) {
        okPub = result.slice(21, 53);
        console.info("OnlyKey Public Key: ", okPub );
        sharedsec = nacl.box.before(Uint8Array.from(okPub), appKey.secretKey);
        console.info("NACL shared secret: ", sharedsec );
        OKversion = result[19] == 99 ? 'Color' : 'Original';
        var FWversion = bytes2string(result.slice(8, 20));
        msg("OnlyKey " + OKversion + " " + FWversion);
        headermsg("OnlyKey " + OKversion + " Connected\n" + FWversion);
        hw_RNG.entropy = result.slice(53, result.length);
        msg("HW generated entropy: " + hw_RNG.entropy);
        var key = sha256(sharedsec); //AES256 key sha256 hash of shared secret
        console.info("AES Key", key);
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
      return;
    } else if (type == 2) {
      if (result) {
        var pubkey = result.slice(0, 1); //slot number containing matching key
        msg("Public Key found in slot" + pubkey);
        var entropy = result.slice(2, result.length);
        msg("HW generated entropy" + entropy);
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
      return pubkey;
    } else if (type == 3 && _status == 'finished') {
      if (result) {
        data = result;
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
    } else if (type == 4 && _status == 'finished') {
      if (result) {
        var oksignature = result.slice(0, result.length); //4+32+2+32
        data = oksignature;
      } else {
        msg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
        headermsg("OnlyKey Not Connected\n" + "Remove and Reinsert OnlyKey");
      }
    }
    if (typeof cb === 'function') cb(null, data);
  });
}

/**
 * Decrypt ciphertext via OnlyKey
 * @param {number} params.msgType
 * @param {number} params.keySlot
 * @param {number} params.poll_type
 * @param {Array} params.ct
 */
async function auth_decrypt(params = {}, cb) { //OnlyKey decrypt request to keyHandle
  await init();
  await wait(1000);
  if (typeof(sharedsec) === "undefined"){
    //button.textContent = "Insert OnlyKey and reload page";
    return;
  }
  params = {
    msgType: params.msgType || OKDECRYPT,
    keySlot: params.keySlot || 1,
    poll_type: params.poll_type || 3,
    ct: params.ct
  };
  poll_delay = params.poll_delay;
  poll_type = params.poll_type;
  cb = cb || noop;
  if (params.ct.length == 396) {
    params.poll_delay = 5; //5 Second delay for RSA 3072
  } else if (params.ct.length == 524) {
    params.poll_delay = 7; //7 Second delay for RSA 4096
  }
  var padded_ct = params.ct.slice(12, params.ct.length);
  var keyid = params.ct.slice(1, 8);
  var pin_hash = sha256(padded_ct);
  console.info("Padded CT Packet bytes", Array.from(padded_ct));
  console.info("Key ID bytes", Array.from(keyid));
  pin  = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  msg("Generated PIN" + pin);
  params.ct = typeof padded_ct === 'string' ? padded_ct.match(/.{2}/g) : padded_ct;
  return u2fSignBuffer(params, cb);
}

/**
 * Sign message via OnlyKey
 * @param {number} params.msgType
 * @param {number} params.keySlot
 * @param {number} params.poll_type
 * @param {Array} params.ct
 */
async function auth_sign(params = {}, cb) { //OnlyKey sign request to keyHandle
  await init();
  await wait(1000);
  if (typeof(sharedsec) === "undefined"){
    //button.textContent = "Insert OnlyKey and reload page";
    return;
  }
  params = {
    msgType: params.msgType || OKSIGN,
    keySlot: params.keySlot || 2,
    poll_type: params.poll_type || 4,
    poll_delay: params.poll_delay,
    ct: params.ct
  };
  poll_delay = params.poll_delay;
  poll_type = params.poll_type;
  var pin_hash = sha256(params.ct);
  cb = cb || noop;
  console.info("Signature Packet bytes ", Array.from(params.ct));
  pin = [ get_pin(pin_hash[0]), get_pin(pin_hash[15]), get_pin(pin_hash[31]) ];
  console.info("Generated PIN", pin);
  params.ct = typeof params.ct === 'string' ? params.ct.match(/.{2}/g) : params.ct;
  return u2fSignBuffer(params, cb);
}

/**
 * Parse custom U2F sign response
 * @param {Array} response
 */
async function custom_auth_response(response) {
  console.info("Response", response);
  var err = response['errorCode'];
  var errMes = response['errorMessage'];
  console.info("Response code ", err);
  console.info(errMes);
    if (err) {
      if (errMes === "device status code: -7f") { //OnlyKey uses err 127 as ping reply, ack
        console.info("Ack message received");
      } else if (errMes === "device status code: -80") { //incorrect challenge code entered
          if (_status === 'waiting_ping') {
          console.info("incorrect challenge code entered");
          //button.textContent = "Incorrect challenge code entered";
          _setStatus('wrong_challenge');
        }
      } else if (errMes === "device status code: -81") { //key type not set as signature/decrypt
        console.info("key type not set as signature/decrypt");
        //button.textContent = "key type not set as signature/decrypt";
        _setStatus('wrong_type');
      } else if (errMes === "device status code: -82") { //no key set in this slot
        console.info("no key set in this slot");
        //button.textContent = "no key set in this slot";
        _setStatus('no_key');
      } else if (errMes === "device status code: -83") { //invalid key, key check failed
        console.info("invalid key, key check failed");
        //button.textContent = "invalid key, key check failed";
        _setStatus('bad_key');
      } else if (errMes === "device status code: -84") { //invalid data, or data does not match key
        console.info("invalid data, or data does not match key");
        //button.textContent = "invalid data, or data does not match key";
        _setStatus('bad_data');
      } else if (errMes === "device status code: -85") { //no data ready
        console.info("no data ready");
        //button.textContent = "no data ready";
      } else if (errMes === "device status code: -b") {
        console.info("Timeout or challenge pin entered ");
        counter-=3;
        _setStatus('done_challenge');
        ping(0);
      } else if (err == 5) { //Ping failed meaning correct challenge entered
        console.info("Timeout or challenge pin entered ");
        _setStatus('done_challenge');
        counter-=2;
        return 1;
      } else if (err) {
        console.info("Failed with error code ", err);
        counter--;
        //other error
        return 1;
      }
    counter++;
    return 1;
    } else if (err) {
      _setStatus('done_challenge');
      return 1;
    }

    var sigData = string2bytes(u2f_unb64(response['signatureData']));
    console.info("Data Received: ", sigData);
    var U2Fcounter = sigData.slice(1,5);
    console.info("U2Fcounter: ", U2Fcounter);
    var parsedData = [];
    var halflen;
    if (sigData[8] == 0) {
      halflen = 256;
    } else {
      halflen = sigData[8];
    }
    Array.prototype.push.apply(parsedData, sigData.slice(9,(halflen+9)));
    Array.prototype.push.apply(parsedData, sigData.slice((halflen+9+2), (halflen+9+2+halflen)));
    if (U2Fcounter[0] + U2Fcounter[1] + U2Fcounter[2] + U2Fcounter[3] == 0) { //unencrypted data
      console.info("Parsed Data: ", parsedData);
      return parsedData;
    }
    else { //encrypted data
      counter++;
      console.info("Parsed Encrypted Data: ", parsedData);
      _setStatus('finished');
      encrypted_data = parsedData;
      return parsedData;
    }
  }

  /**
   * Perform AES_256_GCM decryption using NACL shared secret
   * @param {Array} encrypted
   * @return {Array}
   */
function aesgcm_decrypt(encrypted) {
  return new Promise(resolve => {
    counter++;
    forge.options.usePureJavaScript = true;
    var key = sha256(sharedsec); //AES256 key sha256 hash of shared secret
    console.log("Key", key);
    var iv = IntToByteArray(counter);
    while (iv.length < 12) iv.push(0);
    iv = Uint8Array.from(iv);
    console.log("IV", iv);
    var decipher = forge.cipher.createDecipher('AES-GCM', key);
    decipher.start({
      iv: iv,
      tagLength: 0, // optional, defaults to 128 bits
    });
    decipher.update(forge.util.createBuffer(Uint8Array.from(encrypted)));
    var plaintext = decipher.output.toHex()
    decipher.finish();

    //console.log("Decrypted AES-GCM Hex", forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec));
    //encrypted = forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexStrToDec);
    resolve(plaintext.match(/.{2}/g).map(hexStrToDec));
  });
}

/**
 * Perform AES_256_GCM encryption using NACL shared secret
 * @param {Array} plaintext
 * @return {Array}
 */
function aesgcm_encrypt(plaintext) {
  return new Promise(resolve => {
    counter++;
    forge.options.usePureJavaScript = true;
    var key = sha256(sharedsec); //AES256 key sha256 hash of shared secret
    console.log("Key", key);
    var iv = IntToByteArray(counter);
    while (iv.length < 12) iv.push(0);
    iv = Uint8Array.from(iv);
    console.log("IV", iv);
    //Counter used as IV, unique for each message
    var cipher = forge.cipher.createCipher('AES-GCM', key);
    cipher.start({
      iv: iv, // should be a 12-byte binary-encoded string or byte buffer
      tagLength: 0
    });
    console.log("Plaintext", plaintext);
    cipher.update(forge.util.createBuffer(Uint8Array.from(plaintext)));
    cipher.finish();
    var ciphertext = cipher.output;
    ciphertext = ciphertext.toHex();
    resolve(ciphertext.match(/.{2}/g).map(hexStrToDec));
  });
}

/**
 * Break cipherText into chunks and send via u2f sign
 * @param {Array} cipherText
 */
async function u2fSignBuffer(params, mainCallback) {
    // this function should recursively call itself until all bytes are sent in chunks
    var message = [255, 255, 255, 255, params.msgType, params.keySlot]; //Add header, message type, and key to use
    var maxPacketSize = 57;
    var finalPacket = params.ct.length - maxPacketSize <= 0;
    var ctChunk = params.ct.slice(0, maxPacketSize);
    message.push(finalPacket ? ctChunk.length : 255); // 'FF'
    Array.prototype.push.apply(message, ctChunk);

    params.ct = params.ct.slice(maxPacketSize);
    var cb = finalPacket ? doPinTimer.bind(null, 20, params) : u2fSignBuffer.bind(null, params, mainCallback);

    var challenge = mkchallenge();
    while (message.length < 64) message.push(0);
    var encryptedkeyHandle = await aesgcm_encrypt(message);
    var b64keyhandle = bytes2b64(encryptedkeyHandle);
    var req = { "challenge": challenge, "keyHandle": b64keyhandle,
                 "appId": appId, "version": version };

    console.info("Handlekey bytes ", message);
    console.info("Sending Handlekey ", encryptedkeyHandle);
    console.info("Sending challenge ", challenge);

    u2f.sign(appId, challenge, [req], async function(response) {
      var result = await custom_auth_response(response);
      msg((result ? "Successfully sent" : "Error sending") + " to OnlyKey");
      if (result) {
        if (finalPacket) {
          console.info("Final packet ");
          _setStatus('pending_challenge');
          cb().then(skey => {
            console.info("skey ", skey);
            mainCallback(skey);
          }).catch(err => msg(err));
        } else {
          cb();
        }
      }
    }, 3);
}

/**
 * Display number of seconds remaining to enter challenge code on OnlyKey
 * @param {number} seconds
 */
window.doPinTimer = async function (seconds) {

  return new Promise(async function updateTimer(resolve, reject, secondsRemaining) {
    secondsRemaining = typeof secondsRemaining === 'number' ? secondsRemaining : seconds || 20;

    if (_status === 'done_challenge' || _status === 'waiting_ping') {
      _setStatus('done_challenge');
      if (OKversion == 'Original') {
        var delay = poll_delay*4;
      }
      const btmsg = `Waiting ${delay} seconds for OnlyKey to process message.`;
      //button.textContent = btmsg;
      console.info("Delay ", delay);
      await ping(delay); //Delay
    } else if (_status === 'pending_challenge') {
        if (secondsRemaining <= 4) {
          const err = 'Time expired for PIN confirmation';
          return reject(err);
        }
        const btmsg = `You have ${secondsRemaining} seconds to enter challenge code ${pin} on OnlyKey.`;
        //button.textContent = btmsg;
        console.info("enter challenge code", pin);
        await ping(0);
    }

    if (_status === 'finished') {
      var decrypted_data = await aesgcm_decrypt(encrypted_data);
      if (decrypted_data.length == 64) {
        var entropy = decrypted_data.slice(36, 64);
        decrypted_data = decrypted_data.slice(0, 35);
        console.info("HW generated entropy =", entropy);
      }
      console.info("Parsed Decrypted Data: ", decrypted_data);
      return resolve(decrypted_data);
    }

    setTimeout(updateTimer.bind(null, resolve, reject, secondsRemaining-=4), 4000);
  });
};

/**
 * Ping OnlyKey for resoponse after delay
 * @param {number} delay
 */
async function ping (delay) {
  console.info("poll type", poll_type);
  return await msg_polling({ type: poll_type, delay: delay });
}

IntToByteArray = function(int) {
    var byteArray = [0, 0, 0, 0];
    for ( var index = 0; index < 4; index ++ ) {
        var byte = int & 0xff;
        byteArray [ (3 - index) ] = byte;
        int = (int - byte) / 256 ;
    }
    return byteArray;
};

function get_pin (byte) {
  if (byte < 6) return 1;
  else {
    return (byte % 5) + 1;
  }
}

function id(s) { return document.getElementById(s); }

function msg(s) {
  id('messages').innerHTML += "<br>" + s;
  console.info(s);
}


var _status;
function _setStatus(newStatus) {
  _status = newStatus;
  msg(`Changed _status to ${newStatus}`);
}

function headermsg(s) { id('header_messages').innerHTML += "<br>" + s; }

function userId() {
    var el = id('userid');
    return el && el.value || 'u2ftest';
}

function slotId() { return id('slotid') ? id('slotid').value : 1; }

function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

function u2f_b64(s) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function u2f_unb64(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(s + '==='.slice((s.length+3) % 4));
}
function string2bytes(s) {
  var len = s.length;
  var bytes = new Uint8Array(len);
  for (var i=0; i<len; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}
function hexStrToDec(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
}

function bcat(buflist) {
  var len = 0;
  for (var i=0; i<buflist.length; i++) {
    if (typeof(buflist[i])=='string') buflist[i]=string2bytes(buflist[i]);
    len += buflist[i].length;
  }
  var buf = new Uint8Array(len);
  len = 0;
  for (var i=0; i<buflist.length; i++) {
    buf.set(buflist[i], len);
    len += buflist[i].length;
  }
  return buf;
}

function chr(c) { return String.fromCharCode(c); } // Because map passes 3 args
function bytes2string(bytes) { return Array.from(bytes).map(chr).join(''); }
function bytes2b64(bytes) { return u2f_b64(bytes2string(bytes)); }

function asn1bytes(asn1) {
  return asn1.stream.enc.slice(
    asn1.stream.pos, asn1.stream.pos + asn1.length + asn1.header);
}

//Generate a random number for challenge value
function mkchallenge() {
  var s = [];
  for(i=0;i<32;i++) s[i] = String.fromCharCode(Math.floor(Math.random()*256));
  return u2f_b64(s.join());
}

function noop() {}
