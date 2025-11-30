let originalImageData = null;
        let stegoImageData = null;
        function switchTab(tab) {
            const cryptoTab = document.getElementById('cryptoTab');
            const stegoTab = document.getElementById('stegoTab');
            const tabBtns = document.querySelectorAll('.tab-btn');

            tabBtns.forEach(btn => btn.classList.remove('active'));

            if (tab === 'crypto') {
                cryptoTab.classList.add('active');
                stegoTab.classList.remove('active');
                tabBtns[0].classList.add('active');
            } else {
                cryptoTab.classList.remove('active');
                stegoTab.classList.add('active');
                tabBtns[1].classList.add('active');
            }
        }
        // ===== KRIPTOGRAFI =====
        function encryptAndDecrypt() {
            const key = document.getElementById('cryptoKey').value;
            const plaintext = document.getElementById('plaintext').value;
            const mode = document.querySelector('input[name="cipherMode"]:checked').value;

            if (!key || key.length < 8) {
                alert('Kunci harus minimal 8 karakter!');
                return;
            }
            if (!plaintext) {
                alert('Masukkan teks yang akan dienkripsi!');
                return;
            }

            try {
                // Enkripsi
                const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
                // Dekripsi
                const decrypted = CryptoJS.AES.decrypt(encrypted, key);
                const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
                // Tampilkan hasil
                document.getElementById('displayPlaintext').textContent = plaintext;
                document.getElementById('displayCiphertext').textContent = encrypted;
                document.getElementById('displayDecrypted').textContent = decryptedText;
                // Statistik
                document.getElementById('plaintextStats').textContent = 
                    `Panjang: ${plaintext.length} karakter`;
                document.getElementById('ciphertextStats').textContent = 
                    `Panjang: ${encrypted.length} karakter | Mode: ${mode}`;
                document.getElementById('decryptedStats').textContent = 
                    `Panjang: ${decryptedText.length} karakter | Status: ${plaintext === decryptedText ? '✅ Berhasil' : '❌ Gagal'}`;
                document.getElementById('cryptoComparison').classList.add('show');
                document.getElementById('cryptoProcess').classList.add('show');
            } catch (error) {
                alert('Terjadi kesalahan: ' + error.message);
            }
        }
        function clearCrypto() {
            document.getElementById('plaintext').value = '';
            document.getElementById('cryptoComparison').classList.remove('show');
            document.getElementById('cryptoProcess').classList.remove('show');
        }
        // ===== STEGANOGRAFI =====
        function loadImage() {
            const input = document.getElementById('imageInput');
            const file = input.files[0]; 
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.getElementById('originalCanvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    document.getElementById('originalStats').textContent = 
                        `Ukuran: ${img.width}x${img.height} pixels`;
                    
                    document.getElementById('stegoComparison').classList.add('show');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function hideMessage() {
            if (!originalImageData) {
                alert('Silakan upload gambar terlebih dahulu!');
                return;
            }

            const message = document.getElementById('secretMessage').value;
            if (!message) {
                alert('Masukkan pesan yang akan disembunyikan!');
                return;
            }

            const canvas = document.getElementById('stegoCanvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = originalImageData.width;
            canvas.height = originalImageData.height;
            
            stegoImageData = new ImageData(
                new Uint8ClampedArray(originalImageData.data),
                originalImageData.width,
                originalImageData.height
            );

            // Konversi pesan ke binary
            const messageBinary = stringToBinary(message + '###END###');
            
            // Sembunyikan pesan di LSB
            let messageIndex = 0;
            for (let i = 0; i < stegoImageData.data.length && messageIndex < messageBinary.length; i += 4) {
                // Modifikasi LSB dari R, G, B
                if (messageIndex < messageBinary.length) {
                    stegoImageData.data[i] = (stegoImageData.data[i] & 0xFE) | parseInt(messageBinary[messageIndex++]);
                }
                if (messageIndex < messageBinary.length) {
                    stegoImageData.data[i + 1] = (stegoImageData.data[i + 1] & 0xFE) | parseInt(messageBinary[messageIndex++]);
                }
                if (messageIndex < messageBinary.length) {
                    stegoImageData.data[i + 2] = (stegoImageData.data[i + 2] & 0xFE) | parseInt(messageBinary[messageIndex++]);
                }
            }

            ctx.putImageData(stegoImageData, 0, 0);
            
            document.getElementById('stegoStats').textContent = 
                `Ukuran: ${canvas.width}x${canvas.height} pixels | Pesan: ${message.length} karakter tersembunyi`;
            
            document.getElementById('stegoProcess').classList.add('show');
            alert('Pesan berhasil disembunyikan dalam gambar!');
        }

        function extractMessage() {
            if (!stegoImageData) {
                alert('Silakan sembunyikan pesan terlebih dahulu!');
                return;
            }

            let binaryMessage = '';
            
            // Ekstrak LSB dari setiap pixel
            for (let i = 0; i < stegoImageData.data.length; i += 4) {
                binaryMessage += (stegoImageData.data[i] & 1).toString();
                binaryMessage += (stegoImageData.data[i + 1] & 1).toString();
                binaryMessage += (stegoImageData.data[i + 2] & 1).toString();
            }

            // Konversi binary ke text
            const message = binaryToString(binaryMessage);
            const endMarker = message.indexOf('###END###');
            const extractedMessage = endMarker !== -1 ? message.substring(0, endMarker) : message;

            document.getElementById('extractedText').textContent = extractedMessage;
            document.getElementById('extractedMessage').classList.add('show');
            
            alert('Pesan berhasil diekstrak dari gambar!');
        }

        function stringToBinary(str) {
            let binary = '';
            for (let i = 0; i < str.length; i++) {
                const charCode = str.charCodeAt(i);
                binary += charCode.toString(2).padStart(8, '0');
            }
            return binary;
        }

        function binaryToString(binary) {
            let str = '';
            for (let i = 0; i < binary.length; i += 8) {
                const byte = binary.substr(i, 8);
                const charCode = parseInt(byte, 2);
                if (charCode === 0) break;
                str += String.fromCharCode(charCode);
            }
            return str;
        }

        function downloadStegoImage() {
            if (!stegoImageData) {
                alert('Tidak ada gambar untuk didownload!');
                return;
            }

            const canvas = document.getElementById('stegoCanvas');
            const link = document.createElement('a');
            link.download = 'stego_image.png';
            link.href = canvas.toDataURL();
            link.click();
        }

        function clearStego() {
            document.getElementById('secretMessage').value = '';
            document.getElementById('imageInput').value = '';
            document.getElementById('stegoComparison').classList.remove('show');
            document.getElementById('extractedMessage').classList.remove('show');
            document.getElementById('stegoProcess').classList.remove('show');
            originalImageData = null;
            stegoImageData = null;
        }

        function copyText(elementId) {
            const text = document.getElementById(elementId).textContent;
            navigator.clipboard.writeText(text).then(() => {
                alert('Teks berhasil disalin!');
            }).catch(err => {
                alert('Gagal menyalin: ' + err);
            });
        }