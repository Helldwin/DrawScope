// check-imports.js
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
	fs.readdirSync(dir).forEach(f => {
		const dirPath = path.join(dir, f);
		const isDirectory = fs.statSync(dirPath).isDirectory();
		isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
	});
}

function checkImports(file) {
	const content = fs.readFileSync(file, 'utf8');
	const importRegex = /import\s+(?:.+?\s+from\s+)?['"](.+)['"]/g;
	let match;
	while ((match = importRegex.exec(content)) !== null) {
		const importPath = match[1];
		if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue; // skip node_modules
		const fullPath = path.resolve(path.dirname(file), importPath);
		if (
			!fs.existsSync(fullPath) &&
			!fs.existsSync(fullPath + '.ts') &&
			!fs.existsSync(fullPath + '.tsx') &&
			!fs.existsSync(fullPath + '.js') &&
			!fs.existsSync(fullPath + '.jsx')
		) {
			console.log(`Missing import in ${file}: ${importPath}`);
		}
	}
}

walkDir('./src', checkImports);
