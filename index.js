const path = require("path");
const fs = require("fs");

const sass = require("node-sass");

let parameters = {
	dir: "",
	ignoredDirs: [
		"node_modules"
	]
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
		let data = fs.readFileSync(originalFile, "utf8").replace(new RegExp(/url\((.*)\)/, "gm"), `url(${dif}$1)`);
		const importRegex = /@import\s?[\"\'].*[\"\']\;?/g;
		[...data.matchAll(importRegex)].forEach(match => {
			const imported = match[0].replace(/^.*[\"\'](.*)[\"\'].*$/g, "$1");
			const fileName = imported.replace(/^.*[\\\/](.*)$/, "$1");
			const dir = path.join(path.parse(originalFile).dir, /[\\\/]/.test(imported) ? imported.replace(/^(.*[\\\/]).*$/g, "$1") : "");
			const file = fs.readdirSync(dir).find(file => new RegExp(`\_?${fileName}`, "g").test(file));
			if(!file) return reject(`can't import ${imported} (file not found)`);
			data = fs.readFileSync(path.join(dir, file), "utf8") + data;
		});
		data = data.replace(importRegex, "");
		sass.render({
			data: data
		}, function(err, result) {
			if(err) return reject(err);
			fs.writeFile(newFile, result.css, e => {
				if(e) throw e;
				resolve({
					file: newFile
				});
			});
		});
	});
};


new Promise((resolve, reject) => {
	if(!process.argv[2]) return reject("you must specify a file.");
	const originalFile = path.resolve(process.argv[2]);
	if(path.parse(originalFile).name[0] === "_") {
		const dir = path.parse(originalFile).dir;
		const files = [];
		function getFiles(source) {
			fs.readdirSync(source, { withFileTypes: true }).forEach(content => {
				if(content.isDirectory()) {
					 if(!parameters.ignoredDirs.find(d => d === content.name)) return getFiles(path.join(dir, content.name));
				} else if(/\.scss$/g.test(content.name) && content.name[0] !== "_") files.push(path.join(source, content.name));
			});
		};
		getFiles(dir);
		Promise.all(files.map(file => buildFile(file))).then(response => {
			resolve(`${response.length} files compiled`);
		}).catch(err => {
			if(err) throw err;
		});
	} else buildFile(originalFile).then(response => {
		resolve(`${path.basename(originalFile)} => .${response.file.replace(new RegExp(`^${path.parse(originalFile).dir.replace(/[\\\/]/g, "\\\\")}(.*)$`, "g"), "$1")}`);
	});
}).then(response => {
	console.log(response)
}).catch(err => {
	console.log(err.formatted)
});