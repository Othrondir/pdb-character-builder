import { buildDocumentSchema, type BuildDocument } from './build-document-schema';

export class JsonImportError extends Error {
  public readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'JsonImportError';
    this.cause = cause;
  }
}

/**
 * Reads a File (from <input type="file">), parses JSON, validates with Zod-strict.
 * Rejects with JsonImportError on any failure (malformed JSON, schema violation).
 *
 * Copy for error surfaces lives in shellCopyEs.persistence.importError; the caller
 * substitutes `{reason}` with `err.message`.
 */
export async function importBuildFromFile(file: File): Promise<BuildDocument> {
  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    throw new JsonImportError('No se pudo leer el archivo', err);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new JsonImportError('El archivo no es JSON válido', err);
  }

  const result = buildDocumentSchema.safeParse(parsed);
  if (!result.success) {
    throw new JsonImportError('El archivo no cumple el esquema de build', result.error);
  }
  return result.data;
}
