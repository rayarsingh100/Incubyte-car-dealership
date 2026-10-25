export const MAX_VEHICLE_PRICE = 9999999999.99;
export const MAX_VEHICLE_QUANTITY = 2147483647;
const MAX_IMAGE_URL_LENGTH = 2048;

function isValidImageUrl(value) {
  if (!value) return true;
  if (value.length > MAX_IMAGE_URL_LENGTH) return false;

  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol) && Boolean(parsedUrl.hostname) && !parsedUrl.username && !parsedUrl.password;
  } catch {
    return false;
  }
}

export function validateVehicleFields(fields) {
  const errors = {};

  for (const name of ["make", "model", "category"]) {
    const value = fields[name].trim();
    if (!value) {
      errors[name] = "This field is required.";
    } else if (value.length > 100) {
      errors[name] = "Use 100 characters or fewer.";
    }
  }

  const imageUrl = fields.imageUrl.trim();
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    errors.imageUrl = "Enter a valid HTTP or HTTPS image URL, up to 2,048 characters, or leave it blank.";
  }

  const price = fields.price.trim();
  if (!price) {
    errors.price = "Enter a price.";
  } else if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) <= 0 || Number(price) > MAX_VEHICLE_PRICE) {
    errors.price = "Enter an amount greater than 0 with up to 2 decimal places.";
  }

  const quantity = fields.quantity.trim();
  if (!quantity) {
    errors.quantity = "Enter a stock quantity.";
  } else if (!/^\d+$/.test(quantity) || !Number.isSafeInteger(Number(quantity)) || Number(quantity) > MAX_VEHICLE_QUANTITY) {
    errors.quantity = "Enter a whole number from 0 to 2,147,483,647.";
  }

  return errors;
}

export function normalizeVehicleFields(fields) {
  return {
    make: fields.make.trim(),
    model: fields.model.trim(),
    category: fields.category.trim(),
    imageUrl: fields.imageUrl.trim() || null,
    price: Number(fields.price),
    quantity: Number(fields.quantity),
  };
}
