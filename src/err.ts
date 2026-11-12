class LibErr extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JsonV2Err";
  }
}
export default LibErr;
