/* eslint-disable unicorn/prefer-module */
const path = require('node:path');
const {register} = require('ts-node');
const typescript = require('typescript');
/* eslint-enable unicorn/prefer-module */

const transformer = transformationContext => sourceFile => {
	const shouldMutateModuleSpecifier = node => {
		if (
			!typescript.isImportDeclaration(node)
      && !typescript.isExportDeclaration(node)
		) {
			return false;
		}

		if (!node.moduleSpecifier) {
			return false;
		}

		if (!typescript.isStringLiteral(node.moduleSpecifier)) {
			return false;
		}

		if (
			!node.moduleSpecifier.text.startsWith('./')
      && !node.moduleSpecifier.text.startsWith('../')
		) {
			return false;
		}

		if (path.extname(node.moduleSpecifier.text) !== '.js') {
			return false;
		}

		return true;
	};

	const visitNode = node => {
		if (shouldMutateModuleSpecifier(node)) {
			const newModuleSpecifier = typescript.factory.createStringLiteral(
				node.moduleSpecifier.text.replace(/\.js$/, '.ts'),
			);

			if (typescript.isImportDeclaration(node)) {
				return typescript.factory.updateImportDeclaration(
					node,
					node.modifiers,
					node.importClause,
					newModuleSpecifier,
					node.assertClause,
				);
			}

			return typescript.factory.updateExportDeclaration(
				node,
				node.modifiers,
				node.isTypeOnly,
				node.exportClause,
				newModuleSpecifier,
				node.assertClause,
			);
		}

		return typescript.visitEachChild(node, visitNode, transformationContext);
	};

	return typescript.visitNode(sourceFile, visitNode);
};

register({
	transformers: {
		before: [transformer],
	},
});
