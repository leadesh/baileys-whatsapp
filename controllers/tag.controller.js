const Tag = require("../models/tag");
const { tagValidation } = require("../validation/user.validity");

exports.addTokenHandler = async (req, res, next) => {
  try {
    const data = req.data;
    const { tag } = req.body;
    await tagValidation.validateAsync(tag);
    if (!data.packageSelected)
      return res.status(403).json("No subscription found for the user");

    const tagsLength = await Tag.aggregate([
      { $match: { owner: data._id } },
      { $group: { _id: null, count: { $count: {} } } },
    ]);
    const totalTags = tagsLength[0]?.count | 0;
    console.log(data.packageSelected.maxKeyword, totalTags);
    if (data.packageSelected.maxKeyword <= totalTags) {
      return res.status(403).json("Keyword limit reached for the user");
    }

    const newTag = new Tag({ value: tag, owner: data.id });
    newTag.save();

    return res.status(201).json(newTag);
  } catch (error) {
    next(error);
  }
};

exports.delTokenHandler = async (req, res, next) => {
  try {
    const data = req.data;
    const tagId = req.params.id;

    const tag = await Tag.findById(tagId);
    if (!tag) throw new Error("Not found tag to delete");
    console.log(tag.owner.toString(), data.id);
    if (tag.owner.toString() !== data.id) {
      throw new Error("Not authorized to delete tag");
    }

    await Tag.findByIdAndDelete(tagId);

    res.status(200).json("Tag deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.editTokenHandler = async (req, res, next) => {
  try {
    const data = req.data;
    console.log(data.id, data._id);
    const tagId = req.params.id;
    const { tag } = req.body;
    await tagValidation.validateAsync(tag);
    const userTag = await Tag.findById(tagId);
    if (!userTag) throw new Error("Not found tag to edit");
    console.log(userTag.owner.toString(), data.id);
    if (userTag.owner.toString() !== data.id) {
      throw new Error("Not authorized to edit tag");
    }

    const editedTag = await Tag.findByIdAndUpdate(
      tagId,
      { $set: { value: tag } },
      { new: true }
    );

    res.status(200).json(editedTag);
  } catch (error) {
    next(error);
  }
};

exports.getTokenHandler = async (req, res, next) => {
  try {
    const data = req.data;
    const tags = await Tag.find({ owner: data.id });
    res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
};
