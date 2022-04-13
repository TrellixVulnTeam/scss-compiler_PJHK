const path = require("path");
const fs = require("fs");

const sass = require("node-sass");

let parameters = {
	dir: ""
};

process.argv.filter(arg => /^--/g.test(arg)).forEach(parameter => {
	parameter = parameter.split("=");
	parameters[parameter[0].split("").slice(2).join("")] = parameter[1].replace(new RegExp("\'", "g"), "");
});

const buildFile = originalFile => {
	return new Promise((resolve, reject) => {
		const outputDir = path.join(path.parse(originalFile).dir, parameters.dir);
		if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
		const newFile = path.join(outputDir, path.parse(originalFile).name + ".css");
		const dif = `${path.relative(path.parse(newFile).dir, path.parse(originalFile).dir)}/`.replace(/\\/g, "/");
		const data = fs.readFileSync(originalFile, "utf8").replace(new RegExp(/url\((.*)\)/, "gm"), `url(${dif}$1)`);
		console.log(data)
		sass.render({
			data: data
		}, function(err, result) {
			if(err) return reject(err);
			fs.writeFile(newFile, result.css, e => {
				if(e) throw e;
				resolve(true);
			});
		});
	});
};


new Promise((resolve, reject) => {
	if(!process.argv[2]) return reject("you must specify a file.");
	const originalFile = path.resolve(process.argv[2]);
	if(path.parse(originalFile).name[0] === "_") {
		const folder = path.join(originalFile, "../");
		const cssFile = path.join(folder, `${path.parse(originalFile).name}.css`);
		console.log(cssFile)
		if(fs.existsSync(cssFile)) fs.unlinkSync(cssFile);
		const files = fs.readdirSync(folder).filter(file => /\.scss$/.test(file));
		files.splice(files.indexOf(path.basename(originalFile)), 1);
		Promise.all(files.map(file => {
			return buildFile(path.join(folder, file));
		})).then(results => {
			resolve(`${results.filter(r => r === true).length} files compiled.`);
		});
	} else buildFile(originalFile).then(response => response === true ? resolve("file compiled.") : console.log("error")).catch(err => err ? reject(err) : null);
}).then(response => {
	console.log(response)
}).catch(err => {
	console.log(err.formatted)
});