import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';

export class CategoryController {
    private categoryService = new CategoryService();

    getAllCategories = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const categories = await this.categoryService.getAllCategories(userId);
            res.json({ success: true, data: categories });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    };
}
