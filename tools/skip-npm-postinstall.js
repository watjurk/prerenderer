// Skip postinstall when deployed to npm.
const { INIT_CWD, PWD } = process.env;

if (INIT_CWD !== PWD) {
	process.exit(0);
}
