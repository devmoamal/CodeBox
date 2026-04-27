import { sign } from "hono/jwt";
import { env } from "@/config/env.config";
import { usersRepository } from "@/repositories/users.repository";
import { LoginInput } from "@codebox/shared";

export class AuthService {
  static async authenticate(data: LoginInput) {
    let user = await usersRepository.findByUsername(data.username);

    // If user doesn't exist, create them
    if (!user) {
      user = await usersRepository.create({
        username: data.username,
      });
    }

    const token = await this.generateToken(user.id, user.username);

    return {
      token,
      user: { id: user.id, username: user.username },
    };
  }

  private static async generateToken(id: string, username: string) {
    return await sign(
      {
        id,
        username,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      },
      env.JWT_SECRET,
      "HS256"
    );
  }
}
