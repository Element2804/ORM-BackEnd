const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [
      {
        model: Category,
        attributes: ['id', 'category_name'],
      },
      {
        model: Tag,
        attributes: ['id', 'tag_name'],
            
      },
     ],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});
   


// get product by id
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {  

      include: [
        {
          model: Category,
          attributes: ['id', 'category_name'],
        },
        {
          model: Tag,
          attributes: ['id', 'tag_name'],
          through: ProductTag,
         
        },
       ],
    

  });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
  // be sure to include its associated Category and Tag data
});

// create new product
router.post('/', async (req, res) => {
  
 await Product.create(req.body)
    .then((product) => {
      
      if (req.body.tagIds.length) {
        const productTagArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagArr);
      }
     
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', async (req, res) => {
  await Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {
        return ProductTag.findAll({
          where: { product_id: req.params.id },
        }).then((productTags) => {
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          const newProductTags = req.body.tagIds
            .filter((tag_id) => !productTagIds.includes(tag_id))
            .map((tag_id) => {
              return {
                product_id: req.params.id,
                tag_id,
              };
            });

          const productTagsRemove = productTags
            .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
            .map(({ id }) => id);

          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }


      return res.json(product);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
   Product.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (!product) {
        res.status(404).json({ message: 'No product found' });
        return;
      }
      res.json(product);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
  
});

module.exports = router;