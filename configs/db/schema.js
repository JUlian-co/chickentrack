import {
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const starsEnum = pgEnum("stars_enum", [
  "0",
  "0.5",
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userName: text("username"),
  email: text("email").unique(),
  profilePic: text("profile_pic").default(
    "https://vvklrsdxblmrlovunsde.supabase.co/storage/v1/object/public/images/public/ChickenTrack_default_profile.png"
  ),
});

export const trucks = pgTable("trucks", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  ownerId: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  ownerEmail: text("owner_email")
    .references(() => profiles.email)
    .notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
});

export const images = pgTable("images", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  uploaderId: uuid("uploader_id")
    .notNull()
    .references(() => profiles.id),
  truckId: uuid("truck_id")
    .notNull()
    .references(() => trucks.id),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  text: text("text").notNull(),
  stars: starsEnum("stars").notNull(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => profiles.id),
  truckId: uuid("truck_id")
    .notNull()
    .references(() => trucks.id),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  truckId: uuid("truck_id")
    .notNull()
    .references(() => trucks.id),
  user_id: uuid("user_id")
    .notNull()
    .references(() => profiles.id),
});
