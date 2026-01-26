import QRCode from "qrcode";

const localIp = "172.17.1.73";
const port = "8081";
const url = `exp://${localIp}:${port}`;

console.log(`\nScan this QR code with the Expo Go app on your mobile device:\n`);
console.log(`Connection URL: ${url}\n`);
console.log(`Make sure your phone is connected to the same Wi-Fi network as this computer.\n`);

QRCode.toString(url, { type: 'terminal', small: true }, function (err, str) {
    if (err) {
        console.error("Error generating QR code:", err);
        return;
    }
    console.log(str);
});
