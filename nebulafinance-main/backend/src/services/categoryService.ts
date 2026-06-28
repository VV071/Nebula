import db from '../config/database';
import { Category } from '../models/Category';

export class CategoryService {
    async getAllCategories(userId: number): Promise<Category[]> {
        const result = await db.query(
            `SELECT * FROM categories 
       WHERE (user_id = $1 OR is_default = 1)
       ORDER BY type, name`,
            [userId]
        );
        return result.rows;
    }
}
