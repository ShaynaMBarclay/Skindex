import { useState } from 'react';

function ProductForm({ onSubmit }) {
  const [product, setProduct] = useState({
    name: '',
    brand: '',
    type: '',
    useAM: false,
    usePM: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedProduct = {
      ...product,
      useTime: [
        product.useAM ? 'AM' : null,
        product.usePM ? 'PM' : null,
      ].filter(Boolean),
    };
    onSubmit(formattedProduct);
    setProduct({
      name: '',
      brand: '',
      type: '',
      useAM: false,
      usePM: false,
    });
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h2>Add a Skincare Product</h2>

      <label>
        Product Name:
        <input type="text" name="name" value={product.name} onChange={handleChange} required />
      </label>

      <label>
        Brand:
        <input type="text" name="brand" value={product.brand} onChange={handleChange} />
      </label>

      <label>
        Product Type:
        <select name="type" value={product.type} onChange={handleChange} required>
          <option value="">-- Select --</option>
          <option value="cleanser">Cleanser</option>
          <option value="toner">Toner</option>
          <option value="serum">Serum</option>
          <option value="moisturizer">Moisturizer</option>
          <option value="sunscreen">Sunscreen</option>
          <option value="exfoliant">Exfoliant</option>
          <option value="treatment">Treatment</option>
        </select>
      </label>

      <fieldset>
        <legend>Use Time:</legend>
        <label>
          <input type="checkbox" name="useAM" checked={product.useAM} onChange={handleChange} /> AM
        </label>
        <label>
          <input type="checkbox" name="usePM" checked={product.usePM} onChange={handleChange} /> PM
        </label>
      </fieldset>

      <button type="submit">Add Product</button>
    </form>
  );
}

export default ProductForm;
