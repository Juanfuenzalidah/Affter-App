const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const javaFile = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'java', 'admob', 'plus', 'cordova', 'AdMob.java');
    if (fs.existsSync(javaFile)) {
        let content = fs.readFileSync(javaFile, 'utf8');
        content = content.replace('MobileAds.getVersionString()', 'MobileAds.getVersion().toString()');
        fs.writeFileSync(javaFile, content);
        console.log('✅ Parche aplicado a AdMob.java para solucionar el error de getVersionString()');
    }
};
