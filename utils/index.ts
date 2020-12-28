export function bodyValidator(body: any, require: string[]) {
  const errors = [];
  for (let keys of require) {
    if (!body[keys]) {
      errors.push(`missing_property_${keys}`);
    }
  }
  if (errors.length > 0) {
    throw new ControllerError(400, {
      errors,
    });
  }
}

export declare class ControllerError {
  constructor(code: number, payload: any);
}

export function ControllerError(code: number, payload: any) {
  return Object.setPrototypeOf({ code, payload }, ControllerError.prototype);
}

ControllerError.prototype = Object.create(Error.prototype, {
  name: { value: "Custom Error", enumerable: false },
});
