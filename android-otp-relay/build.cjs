const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sdk = 'C:\\Users\\HCI\\AppData\\Local\\Android\\Sdk';
const buildTools = path.join(sdk, 'build-tools\\36.0.0');
const platformJar = path.join(sdk, 'platforms\\android-32\\android.jar');
const javaHome = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.19.10-hotspot';
const javac = `"${path.join(javaHome, 'bin\\javac.exe')}"`;
const keytool = `"${path.join(javaHome, 'bin\\keytool.exe')}"`;
const aapt2 = `"${path.join(buildTools, 'aapt2.exe')}"`;
const d8 = `"${path.join(buildTools, 'd8.bat')}"`;
const zipalign = `"${path.join(buildTools, 'zipalign.exe')}"`;
const apksigner = `"${path.join(buildTools, 'apksigner.bat')}"`;

const projectDir = __dirname;
const binDir = path.join(projectDir, 'bin');
const objDir = path.join(projectDir, 'obj');

// Clean and recreate dirs
if (fs.existsSync(objDir)) {
  try { fs.rmSync(objDir, { recursive: true, force: true }); } catch (e) {}
}
fs.mkdirSync(binDir, { recursive: true });
fs.mkdirSync(objDir, { recursive: true });

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: projectDir });
}

console.log('🚀 Step 1: Compiling Android Resources...');
const resZip = path.join(objDir, 'res.zip');
run(`${aapt2} compile --dir "${path.join(projectDir, 'res')}" -o "${resZip}"`);

console.log('📦 Step 2: Linking Resources and Generating R.java...');
const unalignedApk = path.join(objDir, 'unaligned.apk');
run(`${aapt2} link -o "${unalignedApk}" -I "${platformJar}" --manifest "${path.join(projectDir, 'AndroidManifest.xml')}" --java "${path.join(projectDir, 'src')}" --auto-add-overlay "${resZip}"`);

console.log('☕ Step 3: Compiling Java Sources...');
const classesDir = path.join(objDir, 'classes');
fs.mkdirSync(classesDir, { recursive: true });

const javaFilesList = [];
function collectJava(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) collectJava(full);
    else if (file.endsWith('.java')) javaFilesList.push(`"${full}"`);
  });
}
collectJava(path.join(projectDir, 'src'));
const javaFiles = javaFilesList.join(' ');

run(`${javac} -encoding UTF-8 -d "${classesDir}" -cp "${platformJar}" ${javaFiles}`);

console.log('⚙️ Step 4: DEXing bytecode with d8...');
const dexDir = path.join(objDir, 'dex');
fs.mkdirSync(dexDir, { recursive: true });

const classFileList = [];
function collectClasses(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) collectClasses(full);
    else if (file.endsWith('.class')) classFileList.push(`"${full}"`);
  });
}
collectClasses(classesDir);
run(`${d8} --output "${dexDir}" --lib "${platformJar}" ${classFileList.join(' ')}`);

console.log('📂 Step 5: Packaging classes.dex into APK...');
const jar = `"${path.join(javaHome, 'bin\\jar.exe')}"`;
let packaged = false;
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    execSync(`${jar} -uf "${unalignedApk}" classes.dex`, { cwd: dexDir, stdio: 'inherit' });
    packaged = true;
    break;
  } catch (err) {
    console.log(`⚠️ Attempt ${attempt} failed, retrying in 500ms...`);
    execSync('powershell -Command "Start-Sleep -Milliseconds 500"');
  }
}
if (!packaged) throw new Error('Failed to package classes.dex into unaligned.apk');

console.log('📐 Step 6: Zipalign APK...');
const alignedApk = path.join(binDir, 'aligned.apk');
if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
run(`${zipalign} -v -p 4 "${unalignedApk}" "${alignedApk}"`);

console.log('🔑 Step 7: Signing APK with Debug Keystore...');
const keystore = path.join(projectDir, 'debug.keystore');
if (!fs.existsSync(keystore)) {
  run(`${keytool} -genkey -v -keystore "${keystore}" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=AndroidDebug,O=Android,C=US"`);
}

const finalApk = path.join(binDir, 'ChuruOneOtpRelay.apk');
fs.copyFileSync(alignedApk, finalApk);
run(`${apksigner} sign --ks "${keystore}" --ks-pass pass:android --key-pass pass:android "${finalApk}"`);

console.log(`\n🎉 SUCCESS! ChuruOne OTP Relay APK Built: ${finalApk}`);

// Copy to public/ and dist/
const rootDir = path.resolve(projectDir, '..');
const pubDest = path.join(rootDir, 'public', 'otp-relay.apk');
const distDest = path.join(rootDir, 'dist', 'otp-relay.apk');

fs.copyFileSync(finalApk, pubDest);
console.log(`✅ Copied to ${pubDest}`);

if (fs.existsSync(path.join(rootDir, 'dist'))) {
  fs.copyFileSync(finalApk, distDest);
  console.log(`✅ Copied to ${distDest}`);
}
