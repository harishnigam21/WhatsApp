const readMedia = (file) => {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result); // This is what the 'await' will receive
    };

    reader.onerror = (error) => {
      reject(error); // Handles any reading errors
    };

    reader.readAsDataURL(file);
  });
};

export default readMedia;