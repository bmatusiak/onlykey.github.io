require('./onlykey-api.js');
const url = require('url');
const request = require('superagent');
const randomColor = require('randomcolor');
import { saveAs } from 'file-saver';
const JSZip = require('jszip');
var $ = require("jquery");
const urlinputbox = document.getElementById('pgpkeyurl');
const urlinputbox2 = document.getElementById('pgpkeyurl2');
const messagebox = document.getElementById('message');
const button = document.getElementById('onlykey_start');
const usevirtru = document.getElementById('virtrudetails');
var ring = new kbpgp.keyring.KeyRing;
var sender_private_key; //Placeholder key
var sender_public_key;
var recipient_public_key;

var test_pgp_key = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: TEST KEY v1.0.0
Comment: THIS KEY IS JUST A PLACEHOLDER

xcaGBFms0QoBEAC9hQ0tnhwnSYlLQmVTsvVWyYnnS8woQnLLr0gz9gb2ZSxE
gh7SMQewx5xff7zsxhcRoID00tarP4KueEOx2sPwFFgbK5jhN1UDEA0zG3oA
/bkEet6c7Q4Y25wlp0eYRpW2KIEdVH9uzNyUS7S5Phw8QtvxWLI+rudmhrNk
Pvjm4c7kPT1TpfCYDMQmF7RVSaXYDH6vE/gqLKjiD/71LQZmQzDtLkvC2fh4
frBhdZUVHmIuZaDZ/8QtcslODovqAe6stBtCsgZ1lEx8otbTpt88PIYbPNGi
kiHrbjK3CYusoq1Rl4/LN/jFkJnO9J8KpfA5R+lnQ6GfzacQ3BfpkQ7Ib2Tu
NSwHOe5nSGIpbsujWh6GAmRzo+AOHmbUj6gbuaA8qIdD+VDXNh/O4g26be+l
RO12pz6VOCk2W+Gmvwmbk789atmNOIk0eUeJ/jPFyXVqM5DMfHuBssydqQr8
9EoQo+id2ev8glfmx1kT7oiN5d/WCpEq4SSxf7TxNawqIEK5LAgv6dONd8e0
GsTxibRVxqrTDc8q07dIgXU4nybCBHRrcd1gj785uJcSsuSSB5TnRRmcst+q
BsunUZbM8iw9g8OUqZj2k70utgIaP5kIIFhMgne9iLYd/g47pMLdoAWcQXdL
pwcHfB3jF8ukuQCpHg1FaKP8oU1jO6Yrk9FHwwARAQAB/gkDCHD+rb/6JEKx
YOw4tTZ1yyHEQRjSoFuwx2vsi1T96TTF4JlTvncVkaFsbvYrTdybEUjc8e6a
UuKDZoMKzr3VBJXbXXhtZLZlWhd+LWN4bFixn9wifoGHN9ptNzobMo3dibjA
cMkNB6ocxWrlbvq44WNYXPezFIloSzf6vb2puZjVcd1nJSLxHY5HaykTdqwi
2TCQhOTa3EBwlQpNNgUdetA3erf22r+FesfYSVjUt8bO6b7jwaXHUAg0RU9D
SCLPCrAqz4WY9RUxziMiUY531LeKffpALwoA8Qwt9F4i03ecrBw7XKbHvL9O
KRcg+3HUNxT9+3P3v4r3Vyqa80g2iYfiA/yd5f6wKWiYbuhaHiHnFljnPqjr
ufSB1hWJoQVfK7Lau/PIZQqZ3vpo3xQJkG7QyYF5hM5ZKlFd9vqxUQhn2mI4
zC1aOhg/CDLvatspb2J9JxH457YxWsXK4garUl0g6EYTdSZRalLfQ1EHpvzM
jSwwFN8d+UgaqO/X/I3G4oHfnaNRY4YdpIpAZZ1JvKS7v2O/r5ct46bVKQUg
TKffG+4QI/g9sizhmBzOTFWO2i8wdu5gvVxvl7dnPrgxyPBlZK9lryBW2++l
YsjQ41TxPmdzZGfzE3MPvQZ+Sni5QXA3icKDWzEcp8Zd8KukVyvKnVJiMM5F
mpvtcQbhnphpiFFt9aEPO1soid02lNG3qlO97EpS1KExZOW95hF9u2F2q9p/
0BTcahyxjoE1oinakjg/BEqcF8TgaEmpTtDYoljz87vpRyEHKAOl3IXyiubB
WMyZfraF6hZ3mRGKofOX8A7hdqFx1j/6myzywf1JsRSa6u8Dp4m38mDKKhcf
ERqDcVWuJafZBWOXPcdxIVBDmopTn7uM8Ii0wEYWBFqgf6dN2p6BprDcm2Om
qiqhDE3UoqjQXgHqh7Bn8AjpfqSkXFRsrkOhcbyqzYGt+kEbnFPFP1QhyWSj
60p7eMxW7bG6rJcyOWvq5GZaaVime3+sXTV37vYzuNWc0RQ3FklKbiLvVCjL
NHbWOUtQpHE/i39UUK31/Rncqzgoenn6ThqXZZZl+LP8FFIOZ80VnlSxM71U
d7XRqk1wjFE7NBzbtTypaDXbm3Wilq9SJ68kfOxZUC9asAvU5B1teiVshFA2
QmMTCz0hng8/HldlntUOVQjmh/gC5E52cva6QF0Cu8JKfVGoAC5wEIuV3gVx
Zu+IVEtHWpCA8bOudtYx4QZvKVCbjSaK6Rf1UE+cUfLESCnXt9BHzcPq0q90
WVMXNVSS0CQ84FCk3zAZgnrZBmOFuiXvXXqrpS8w2k8LFiP5or4ZCYTc0qUp
pSFk8QBnfdX63IXifBQtuaD1Iz49Lf2Vpfxv+F/qXaPQ6Bl3bfv1QY9nNh48
+OVZBpnMas8W4co/Ke7GiOJKqScpcW/MlaKZVLR2ywthC4vpTjFBiK3epLOF
J63bR/0TV5Koj62CdyVENtecbfWce5yx9s5AAdKDoA3Q18mMm13OJb868Nu0
O2ZlAXb/3PMWp8zS6zd6gP8Aw8q1a+NlZVtyFA7aaBEQyRbHMG/Qeyy6wmlE
nP/rfuWVuPLmSD7GsS6TkofmLsk/fuWbuAFBnYuoWM+XrRwWX0SOmZJzYELV
shnhPaTO+71B4vsCbuQVfNcMYBmpt7iAG23Ky1FNnKy8jszwq4S2XPRukT0+
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
=ayNx
-----END PGP PRIVATE KEY BLOCK-----`;

window.initok = initok();
window.custom_keyid;

window.initapp = function() {
  var val = document.action.select_one.value;
  window._status = val;
  console.info('Radio button selected' + val);
  if (window._status=='Encrypt Only') {
    document.getElementById('pgpkeyurl2').style.display = "none";
    document.getElementById('pgpkeyurl').style.display = "initial";
    button.textContent = 'Encrypt';
  }
  else if (window._status=='Sign Only') {
    document.getElementById('pgpkeyurl').style.display = "none";
    document.getElementById('pgpkeyurl2').style.display = "initial";
    button.textContent = 'Sign';
  }
  else if (window._status=='Encrypt and Sign') {
    document.getElementById('pgpkeyurl').style.display = "initial";
    document.getElementById('pgpkeyurl2').style.display = "initial";
    button.textContent = 'Encrypt and Sign';
  }
  else if (window._status=='Decrypt and Verify') {
    document.getElementById('pgpkeyurl').style.display = "initial";
    button.textContent = 'Decrypt and Verify';
  }
  else if (window._status=='Decrypt Only') {
    document.getElementById('pgpkeyurl').style.display = "initial";
    button.textContent = 'Decrypt';
  }
  document.action.select_one.forEach(el => el.addEventListener('change', window.initapp.bind(null, false)));
};

class Pgp2go {
    constructor() {
        document.getElementsByTagName('fieldset')[0].style.backgroundColor = randomColor({
            luminosity: 'bright',
            format: 'rgba'
        });
    }

	async startDecryption() {
      window.poll_type = 3;
      window.poll_delay = 1;
      console.info(window.poll_type);
			button.classList.remove('error');
			button.classList.add('working');
      if (urlinputbox.value == "" && window._status=='Decrypt and Verify') {
          this.showError(new Error("I need senders's public pgp key to verify :("));
          return;
      } else if (urlinputbox.value != "" && window._status=='Decrypt and Verify') {
        let keyurl = url.parse(urlinputbox.value);
          if (urlinputbox.value.slice(0,10) != '-----BEGIN') { // Check if its a pasted public key
              sender_public_key = await this.downloadPublicKey(urlinputbox.value);
            } else {
              sender_public_key = urlinputbox.value;
            }
          }
          if (messagebox != null) this.decryptText(sender_public_key, messagebox.value);
          else this.decryptFile(sender_public_key, document.getElementById('file'));
	}

	decryptText(key, ct) {
      switch (window._status) {
        case 'Decrypt and Verify':
          this.loadPublic(key);
          button.textContent = 'Decrypting and verifying message ...';
          break;
        case 'Decrypt Only':
          button.textContent = 'Decrypting message ...';
          var Decrypt_Only = true;
          break;
        default:
      }
      this.loadPrivate();
      kbpgp.unbox({
              keyfetch: ring,
              armored: ct,
              strict : Decrypt_Only ? false : true
          }, (err, ct) => {
          if (err)
              return void this.showError(err);
          if (Decrypt_Only) {
          button.textContent = "Done :) Click here to copy message";
          } else {
            var ds = recipient_public_key = null;
              ds = ct[0].get_data_signer();
              if (ds == null) {
                button.textContent = "Done :) Message has no signature, Click here to copy message";
              } else {
                console.log(ds);
                if (ds) { recipient_public_key = ds.get_key_manager(); }
                if (recipient_public_key) {
                  console.log("Signed by PGP Key");
                  var keyid = recipient_public_key.get_pgp_fingerprint().toString('hex').toUpperCase();
                  keyid = keyid.slice(24, 40);
                  var userid = recipient_public_key.userids[0].components.email.split("@")[0];
                  console.log(keyid);
                  console.log(userid);
                  button.textContent = "Done :) Signed by " + userid + " (Key ID: " + keyid + "), Click here to copy message";
              }
            }
          }
          console.info(ct);
          messagebox.value = ct;
          messagebox.focus();
          messagebox.select();
          button.classList.remove("working")
      });
  }

  async decryptFile(key, ct) {
    var txt = "";
    if ('files' in ct) {
        var file = ct.files[0];
        if (!file.size) {
          this.showError(new Error("No files selected :("));
          return;
        } else {
            if ('name' in file) {
              txt += "file name: " + file.name;
            }
            if ('size' in file) {
              txt += " file size: " + file.size;
            }
            if ('type' in file) {
              txt += " file type: " + file.type;
            }
        }
    } else {
      this.showError(new Error("No files selected :("));
    }

    var reader = new FileReader();
    reader.filename = file.name;
    var filename = reader.filename;
    filename = filename.slice(0, filename.length-4);
    reader.readAsArrayBuffer(file);
    var parsedfile = await this.myreaderload(reader);

    console.info(usevirtru);
    console.info(typeof usevirtru);

    if (usevirtru != null) {
      try {
            await encryptOrDecryptFile(parsedfile, filename, false, false);
            return resolve();
          } catch (err) {
            console.error(err);
            alert('An error occurred attempting to encrypt this file. Please be sure you have authenticated, and try again.');
          }
          button.classList.remove('working');
    }
      var buffer = kbpgp.Buffer.from(parsedfile);
      switch (window._status) {
        case 'Decrypt and Verify':
          this.loadPublic(key);
          button.textContent = 'Decrypting and verifying...';
          break;
        case 'Decrypt Only':
          button.textContent = 'Decrypting...';
          var Decrypt_Only = true;
          break;
        default:
      }
      this.loadPrivate();
      kbpgp.unbox({
              keyfetch: ring,
              raw: buffer,
              strict : Decrypt_Only ? false : true
          }, (err, ct) => {
          if (err)
              return void this.showError(err);
          if (Decrypt_Only) {
          button.textContent = 'Done :)  downloading decrypted file '+filename;
          } else {
            var ds = recipient_public_key = null;
              ds = ct[0].get_data_signer();
              if (ds == null) {
                button.textContent = 'Done :) file has no signature, downloading decrypted file '+filename;
              } else {
                console.log(ds);
                if (ds) { recipient_public_key = ds.get_key_manager(); }
                if (recipient_public_key) {
                  console.log("Signed by PGP Key");
                  var keyid = recipient_public_key.get_pgp_fingerprint().toString('hex').toUpperCase();
                  keyid = keyid.slice(24, 40);
                  var userid = recipient_public_key.userids[0].components.email.split("@")[0];
                  console.log(keyid);
                  console.log(userid);
                  button.textContent = 'Done :) Signed by ' + userid + ' (Key ID: ' + keyid + '), downloading decrypted file '+filename;
              }
            }
          }
          var finalfile = new Blob([ct[0].toBuffer()], {type: "text/plain;charset=utf-8"});
          //var finalfile2 = new Blob([result_buffer], {type: "octet/stream"});
          //new var blob = new Blob([xhr.response], {type: "octet/stream"});
          saveAs(finalfile, filename);
          button.classList.remove('working');
    });
  }

  async startEncryption() {
      button.classList.remove('error');
      button.classList.add('working');
      window.poll_type = 4;
      console.info(window.poll_type);
      if (urlinputbox.value == "" && (window._status=='Encrypt and Sign' || window._status=='Encrypt Only')) {
          this.showError(new Error("I need recipient's public pgp key to encrypt :("));
          return;
      }
      if (urlinputbox2.value == "" && (window._status=='Encrypt and Sign' || window._status=='Sign Only')) {
          this.showError(new Error("I need sender's public pgp key to sign :("));
          return;
      }
      if (urlinputbox.value.slice(0,10) != '-----BEGIN' && window._status!='Sign Only') { // Check if its a pasted public key
          console.info(urlinputbox.value.slice(0,10));
          sender_public_key = await this.downloadPublicKey(urlinputbox.value);
          console.info("sender_public_key" + sender_public_key);
      } else {
          sender_public_key = urlinputbox.value;
      } if (urlinputbox2.value.slice(0,10) != '-----BEGIN' && window._status!='Encrypt Only') { // Check if its a pasted public key
          console.info(urlinputbox2.value.slice(0,10));
          recipient_public_key = await this.downloadPublicKey(urlinputbox2.value);
          console.info("recipient_public_key" + recipient_public_key);
      } else {
          recipient_public_key = urlinputbox2.value;
      }
      if (messagebox != null) await this.encryptText(sender_public_key, recipient_public_key, messagebox.value);
      else await this.encryptFile(sender_public_key, recipient_public_key, document.getElementById('file'));
  }

  downloadPublicKey(url) {
    return new Promise(resolve => {
      button.textContent = 'Downloading public key ...';
      if (url.slice(0,8) != 'https://') {
        console.info(url);
        url = 'https://keybase.io/'.concat(url, '/pgp_keys.asc');
        console.info(url);
      }
      request
          .get(url)
          .end((err, key) => {
              if (err) {
                  err.message += ' Try to directly paste the public PGP key in.';
                  this.showError(err);
                  return;
              }
              resolve(key.text);
              return key.text;
          });
        });
  }

  async encryptText(key1, key2, msg) {
      return new Promise(resolve => {
      switch (window._status) {
        case 'Encrypt and Sign':
          this.loadPublic(key1);
          this.loadPublicSignerID(key2);
          this.loadPrivate();
          var params = {
            msg: msg,
            encrypt_for: recipient_public_key,
            sign_with: sender_private_key
          };
          button.textContent = 'Encrypting and signing message ...';
          break;
        case 'Encrypt Only':
          this.loadPublic(key1);
          var params = {
            msg: msg,
            encrypt_for: recipient_public_key
          };
          button.textContent = 'Encrypting message ...';
          break;
        case 'Sign Only':
          this.loadPublicSignerID(key2);
          this.loadPrivate();
          var params = {
            msg: msg,
            sign_with: sender_private_key
          };
          button.textContent = 'Signing message ...';
          break;
        default:
      }
      kbpgp.box(params, (err, results) => {
          if (err) {
              this.showError(err);
              return;
          }
          if ((document.getElementById('onlykey_start').value) == 'Sign Only') button.textContent = 'Done :)  Click here to copy message, then paste signed message into an email, IM, whatever.';
          else button.textContent = 'Done :)  Click here to copy message, then paste encrypted message into an email, IM, whatever.';
          window._status = "finished";
          messagebox.value =  results;
          messagebox.focus();
          messagebox.select();
          button.classList.remove('working');
          return resolve();
      });
  });
}

async encryptFile(key1, key2, f) {

  //console.info(f);
  //console.info(f.files[0]);
  // todo process multiple files
  // await readfiles(infile);
  var zip = new JSZip();
  //var folderzip = zip.folder("files");
  var txt = "";
  if ('files' in f) {
    for (var i = 0; i < f.files.length; i++) {
      var file = f.files[i];
      if (!file.size) {
        this.showError(new Error("No files selected :("));
        return;
      } else {
          if ('name' in file) {
            txt += "file name: " + file.name;
            zip.file(file.name, file);
          }
          if ('size' in file) {
            txt += " file size: " + file.size;
          }
          if ('type' in file) {
            txt += " file type: " + file.type;
          }
      }
    }
  } else {
    this.showError(new Error("No files selected :("));
  }

  var firstfilename = f.files[0].name;
  var filename = document.getElementById('filename').value ? document.getElementById('filename').value : firstfilename;
  if (typeof f.files[1] !== "undefined") button.textContent ='Processing files';
  else button.textContent = 'Processing ' + filename;
  document.getElementById('filedetails').innerHTML = txt;
  return new Promise(resolve => {
    zip.generateAsync({
    type: "uint8array",
    //compression: "STORE",
    compression: "DEFLATE",
    compressionOptions: {
        level: 1
        }
    })
    .then(function (zip) {
      //console.log(zip);
      //console.log(kbpgp.Buffer.from(zip));

        switch (window._status) {
          case 'Encrypt and Sign':
            this.loadPublic(key1);
            this.loadPublicSignerID(key2);
            this.loadPrivate();
            var params = {
              msg: kbpgp.Buffer.from(zip),
              encrypt_for: recipient_public_key,
              sign_with: sender_private_key
            };
            button.textContent = 'Encrypting and signing...';
            break;
          case 'Encrypt Only':
            this.loadPublic(key1);
            var params = {
              msg: kbpgp.Buffer.from(zip),
              encrypt_for: recipient_public_key
            };
            button.textContent = 'Encrypting...';
            break;
          case 'Sign Only':
            this.loadPublicSignerID(key2);
            this.loadPrivate();
            var params = {
              msg: kbpgp.Buffer.from(zip),
              sign_with: sender_private_key
            };
            button.textContent = 'Signing...';
            break;
          default:
        }

        kbpgp.box(params, async function(err, result_string, result_buffer) {
            if (err) {
                this.showError(err);
                return;
            }
            //console.log(result_string);
            //console.log(result_buffer);
            //console.log(filename);
            if ((document.getElementById('onlykey_start').value) == 'Sign Only') button.textContent = 'Done :)  downloading signed file '+filename+'.zip.gpg';
            else button.textContent = 'Done :)  downloading encrypted file '+filename+'.zip.gpg';
            window._status = "finished";
            if (usevirtru != null) {
              try {
                    button.textContent = 'Done :)  downloading encrypted file '+filename+'.tdf';
                    await encryptOrDecryptFile(result_buffer, filename+".zip.gpg", true, 1);
                    return resolve();
                  } catch (err) {
                    console.error(err);
                    alert('An error occurred attempting to encrypt this file. Please be sure you have authenticated, and try again.');
                  }
                  button.classList.remove('working');
            } else {
              var finalfile = new Blob([result_buffer], {type: "text/plain;charset=utf-8"});
              saveAs(finalfile, filename+".zip.gpg");
              button.classList.remove('working');
              return resolve();
            }
        });
      }.bind(this));
    });
}

async myreaderload(reader) {
  return new Promise(resolve => {
    reader.onloadend = function () {
      return resolve(reader.result);
    }
  });
}


async readfiles(infile) {
  return new Promise(resolve => {
  for (var i = 0; i < infile.length; i++) {
          var f = infile[i];
          var $title = $("<h4>", {
              text : f.name
          });
          var $fileContent = $("<ul>");
          $result.append($title);
          $result.append($fileContent);

          var dateBefore = new Date();
          JSZip.loadAsync(f)                                   // 1) read the Blob
          .then(function(zip) {
              var dateAfter = new Date();
              $title.append($("<span>", {
                  "class": "small",
                  text:" (loaded in " + (dateAfter - dateBefore) + "ms)"
              }));

              zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
                  $fileContent.append($("<li>", {
                      text : zipEntry.name
                  }));
              });
          }, function (e) {
              $result.append($("<div>", {
                  "class" : "alert alert-danger",
                  text : "Error reading " + f.name + ": " + e.message
              }));
          });
      }
      resolve();
  });
}

loadPublic(key) {
  button.textContent = "Checking recipient's public key...";
  if (key == "") {
    this.showError(new Error("I need recipient's public pgp key :("));
    return;
  }
  kbpgp.KeyManager.import_from_armored_pgp({
      armored: key
  }, (error, recipient) => {
      if (error) {
          this.showError(error);
          return;
      } else {
          recipient_public_key = recipient;
          ring.add_key_manager(recipient);
      }
  });
}


loadPublicSignerID(key) {
  button.textContent = "Checking sender's public key...";
  if (key == "") {
    this.showError(new Error("I need sender's public pgp key :("));
    return;
  }
  kbpgp.KeyManager.import_from_armored_pgp({
      armored: key
  }, (error, sender) => {
      if (error) {
          this.showError(error);
          return;
      } else {
          sender_public_key = sender;
          var keyids = sender_public_key.get_all_pgp_key_ids();
          if (typeof keyids[2] !== "undefined") {
            window.poll_delay = 1;  //Assuming RSA 2048
            var subkey = 2;
          } else {
            window.poll_delay = 8;  //Assuming RSA 4096 or 3072
            var subkey = 0;
          }
          window.custom_keyid = keyids[subkey].toString('hex').toUpperCase();
          window.custom_keyid = window.custom_keyid.match(/.{2}/g).map(hexStrToDec);
          console.info("window.custom_keyid" + window.custom_keyid);
      }
  });
}

loadPrivate() {
  var _this = this;
  kbpgp.KeyManager.import_from_armored_pgp({
      armored: test_pgp_key
  }, (err, sender) => {
      if (err)
          return void this.showError(err);

      if (sender.is_pgp_locked()) {
          let passphrase = 'test123';

          sender.unlock_pgp({
              passphrase: passphrase
          }, err => {
              if (!err) {
                  console.log(`Loaded test private key using passphrase ${passphrase}`);
                  sender_private_key = sender;
                  ring.add_key_manager(sender);
              }
          });
      } else {
          console.log("Loaded private key w/o passphrase");
      }
  });
}

	showError(error) {
        console.log("error:", error);
        button.textContent = error.message;
        button.classList.remove('working');
        button.classList.add('error');
    }

}

let p2g = new Pgp2go();

button.addEventListener('click', async function() {
    switch (window._status) {
        case 'Encrypt and Sign':
        case 'Encrypt Only':
        case 'Sign Only':
            await p2g.startEncryption();
            break;
        case 'Decrypt and Verify':
        case 'Decrypt Only':
            p2g.startDecryption();
            break;
        case 'pending_pin':
            break;
        case 'finished':
          if (messagebox != null) {
              try {
                 messagebox.focus();
                 messagebox.select();
                 var successful = document.execCommand('copy');
                 var msg = successful ? 'successful' : 'unsuccessful';
                 button.textContent = 'Done :)  Message copied to clipboard';
                 console.info('Copying text command was ' + msg);
                 if (!successful) button.textContent = 'Oops, unable to copy message to clipboard, try copying message manually';
               } catch (err) {
                 button.textContent = 'Oops, unable to copy message to clipboard, try copying message manually';
                 console.info('Oops, unable to copy');
               }
             }
            else {
              // send file to user
            }
            break;
    }
}, false);

/**
 * Use promise and setTimeout to wait x seconds
 */
let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function hexStrToDec(hexStr) {
    return ~~(new Number('0x' + hexStr).toString(10));
}

urlinputbox.onkeyup = function () {
    let rows_current = Math.trunc((urlinputbox.value.length * parseFloat(window.getComputedStyle(urlinputbox, null).getPropertyValue('font-size'))) / (urlinputbox.offsetWidth * 1.5)) + 1;
    urlinputbox.rows = (rows_current > 10) ? 10 : rows_current;
};
