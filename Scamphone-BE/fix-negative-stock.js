// Script để fix stock âm trong database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './Models/ProductModel.js';

dotenv.config();

const fixNegativeStock = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Tìm tất cả products
    const products = await Product.find({});
    
    let fixedCount = 0;
    
    for (const product of products) {
      let needsSave = false;
      
      // Fix stock_quantity âm
      if (product.stock_quantity < 0) {
        console.log(`❌ Product "${product.name}" has negative stock_quantity: ${product.stock_quantity}`);
        product.stock_quantity = 0;
        needsSave = true;
        fixedCount++;
      }
      
      // Fix variant stock âm
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant, index) => {
          if (variant.stock < 0) {
            const attrsStr = variant.attributes 
              ? Object.entries(variant.attributes instanceof Map 
                  ? Object.fromEntries(variant.attributes) 
                  : variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
              : 'Unknown';
            
            console.log(`❌ Product "${product.name}" variant (${attrsStr}) has negative stock: ${variant.stock}`);
            product.variants[index].stock = 0;
            needsSave = true;
            fixedCount++;
          }
        });
        
        // Recalculate total stock_quantity from variants
        if (needsSave) {
          product.stock_quantity = product.variants.reduce((total, v) => total + (v.stock || 0), 0);
        }
      }
      
      if (needsSave) {
        await product.save();
        console.log(`✅ Fixed stock for product: ${product.name}`);
      }
    }
    
    console.log(`\n✅ Done! Fixed ${fixedCount} negative stock values.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixNegativeStock();
