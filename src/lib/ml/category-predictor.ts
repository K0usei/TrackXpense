import * as tf from '@tensorflow/tfjs'

export class CategoryPredictor {
  private static model: tf.LayersModel | null = null
  private static readonly CATEGORIES = [
    'Food & Dining',
    'Transportation',
    'Bills & Utilities',
    'Groceries',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Others'
  ]

  static async loadModel() {
    try {
      this.model = await tf.loadLayersModel('/models/category_model/model.json')
    } catch (error) {
      console.error('Failed to load category prediction model:', error)
      throw error
    }
  }

  static async predict(text: string, amount: number, vendor: string): Promise<string> {
    if (!this.model) {
      await this.loadModel()
    }

    try {
      // Prepare input features
      const features = this.preprocessFeatures(text, amount, vendor)
      const prediction = await this.model!.predict(features) as tf.Tensor
      const categoryIndex = (await prediction.argMax(1).data())[0]

      return this.CATEGORIES[categoryIndex]
    } catch (error) {
      console.error('Category prediction failed:', error)
      return 'Others' // Fallback category
    }
  }

  private static preprocessFeatures(text: string, amount: number, vendor: string): tf.Tensor {
    // Implement feature preprocessing logic here
    // This should match the preprocessing used during training
    return tf.tensor([[/* processed features */]])
  }
}