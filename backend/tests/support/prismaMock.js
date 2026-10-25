const users = [];
const vehicles = [];
const purchases = [];

const clone = (value) => value === null || value === undefined ? value : structuredClone(value);
const selectFields = (record, select) => select ? Object.fromEntries(Object.keys(select).filter((field) => select[field]).map((field) => [field, clone(record[field])])) : clone(record);
const matches = (record, where) => {
  if (!where) return true;
  return Object.entries(where).every(([key, condition]) => {
    if (key === "OR") return condition.some((clause) => matches(record, clause));
    if (condition && typeof condition === "object" && !(condition instanceof Date)) {
      return Object.entries(condition).every(([operator, value]) => {
        if (operator === "contains") return String(record[key]).toLowerCase().includes(value.toLowerCase());
        if (operator === "mode") return true;
        if (operator === "gte") return Number(record[key]) >= Number(value);
        if (operator === "lte") return Number(record[key]) <= Number(value);
        if (operator === "gt") return Number(record[key]) > Number(value);
        return false;
      });
    }
    return record[key] === condition;
  });
};

const duplicateError = () => Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
const missingError = () => Object.assign(new Error("Record not found"), { code: "P2025" });

const prisma = {
  user: {
    findUnique: jest.fn(async ({ where, select }) => selectFields(users.find((user) => matches(user, where)), select)),
    create: jest.fn(async ({ data, select }) => {
      if (users.some((user) => user.email === data.email)) throw duplicateError();
      const user = { id: crypto.randomUUID(), role: "USER", createdAt: new Date(), ...clone(data) };
      users.push(user);
      return selectFields(user, select);
    }),
  },
  vehicle: {
    findMany: jest.fn(async ({ where, skip = 0, take = 20, orderBy }) => {
      let results = vehicles.filter((vehicle) => matches(vehicle, where));
      if (orderBy?.createdAt === "desc") results = results.slice().reverse();
      return clone(results.slice(skip, skip + take));
    }),
    count: jest.fn(async ({ where }) => vehicles.filter((vehicle) => matches(vehicle, where)).length),
    findUnique: jest.fn(async ({ where, select }) => selectFields(vehicles.find((vehicle) => matches(vehicle, where)), select)),
    create: jest.fn(async ({ data }) => {
      const vehicle = { id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...clone(data) };
      vehicles.push(vehicle);
      return clone(vehicle);
    }),
    update: jest.fn(async ({ where, data }) => {
      const vehicle = vehicles.find((item) => matches(item, where));
      if (!vehicle) throw missingError();
      for (const [key, value] of Object.entries(data)) vehicle[key] = value?.increment ? vehicle[key] + value.increment : clone(value);
      vehicle.updatedAt = new Date();
      return clone(vehicle);
    }),
    updateMany: jest.fn(async ({ where, data }) => {
      const vehicle = vehicles.find((item) => matches(item, where));
      if (!vehicle) return { count: 0 };
      if (data.quantity.decrement) vehicle.quantity -= data.quantity.decrement;
      if (data.quantity.increment) vehicle.quantity += data.quantity.increment;
      vehicle.updatedAt = new Date();
      return { count: 1 };
    }),
    delete: jest.fn(async ({ where }) => {
      const index = vehicles.findIndex((vehicle) => matches(vehicle, where));
      if (index < 0) throw missingError();
      if (purchases.some((purchase) => purchase.vehicleId === vehicles[index].id)) {
        throw Object.assign(new Error("Foreign key constraint failed"), { code: "P2003" });
      }
      return vehicles.splice(index, 1)[0];
    }),
  },
  purchase: {
    create: jest.fn(async ({ data }) => {
      const purchase = { id: crypto.randomUUID(), createdAt: new Date(), ...clone(data) };
      purchases.push(purchase);
      return clone(purchase);
    }),
  },
  $transaction: jest.fn(async (callback) => callback(prisma)),
  $disconnect: jest.fn(),
  reset() {
    users.splice(0);
    vehicles.splice(0);
    purchases.splice(0);
    for (const model of [this.user, this.vehicle, this.purchase]) {
      for (const method of Object.values(model)) if (method.mockClear) method.mockClear();
    }
    this.$transaction.mockClear();
  },
  setRole(email, role) {
    const user = users.find((item) => item.email === email);
    if (user) user.role = role;
  },
  getVehicle(id) {
    return vehicles.find((vehicle) => vehicle.id === id);
  },
  getPurchaseCount() {
    return purchases.length;
  },
};

module.exports = prisma;
