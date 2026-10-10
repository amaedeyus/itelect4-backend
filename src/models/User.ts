import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "student" | "security_admin";

export interface IUser extends Document {
name: string;
email: string;
password: string;
role: UserRole;
isActive: boolean;
comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
{
name: {
type: String,
required: [true, "Name is required"],
trim: true,
},
email: {
type: String,
required: [true, "Email is required"],
unique: true,
lowercase: true,
trim: true,
match: [
/^[^\s@]+@[^\s@]+.[^\s@]+$/,
"Please provide a valid email address",
],
},
password: {
type: String,
required: [true, "Password is required"],
minlength: [8, "Password must be at least 8 characters long"],
select: false,
},
role: {
  type: String,
  enum: {
    values: ["student", "security_admin"],
    message: "Invalid user role",
  },
  default: "student",
  required: true,
},
isActive: {
type: Boolean,
default: true,
},
},
{
timestamps: true,
toJSON: {
  transform(_doc, ret: Record<string, any>) {
    const user = { ...ret };

    user.id = String(user._id);
    delete user._id;
    delete user.__v;
    delete user.password;

    return user;
  },
},
}
);

// Hash the password before saving a new or modified password.
userSchema.pre("save", async function () {
if (!this.isModified("password")) {
return;
}

this.password = await bcrypt.hash(this.password, 10);
});

// Compare a login password against the stored hash.
userSchema.methods.comparePassword = async function (
candidatePassword: string
): Promise<boolean> {
return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
