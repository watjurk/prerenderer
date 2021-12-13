export abstract class Plugin<T> {
	abstract readonly name: string;

	abstract execute(prerenderInstance: T): Promise<void> | void;
}
