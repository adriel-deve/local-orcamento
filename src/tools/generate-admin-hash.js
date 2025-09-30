import bcrypt from 'bcrypt';

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    process.exit(1);
  }
  console.log('Password hash para admin123:');
  console.log(hash);
  console.log('\nUse este hash no arquivo db/init-auth-system.sql');
});
