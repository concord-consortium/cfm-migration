const die = (message?: string) => {
  if (message) {
    console.error(message)
  }
  process.exit(1)
}

export default die