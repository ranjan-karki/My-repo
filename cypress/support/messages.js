export const messages = {
  // ─── Root ───────────────────────────────────────────────────────────────────
  notFound: "The item/page you were looking for cannot be found.",
  invalidCredentials: "Invalid username/password combination.",
  rateLimit: "Too many wrong login attempts were made, please try again after some time",
  titleLengthLimit100: "The title may not be greater than 100 characters.",
  domainCaseError: "The domain must be a lowercase.",
  domainCharConatin: "Domain must contain alphabet",
  imageFileTypeError: "The file must be a file of type: jpg, png, jpeg, svg.",
  logoUrlTypeError: "The logo url must end with one of the following: jpg, png, jpeg, svg.",
  domainLengthLimit: "The domain may not be greater than 50 characters.",
  domainAlreadyTaken: "The domain has already been taken.",
  logoRequired: "The logo field is required when logo url is not present.",
  logoUrlRequired: "The logo url field is required when logo is not present.",

  // ─── Common ─────────────────────────────────────────────────────────────────
  titleRequired: "The title field is required.",
  titleMax: "The title may not be greater than 255 characters.",
  titleType: "The title must be a string.",
  statusRequired: "The status field is required.",
  statusInvalid: "The selected status is invalid.",
  orderRequired: "The order field is required.",
  orderMin: "The order must be at least 1.",
  orderMinZero: "The order must be at least 0.",
  orderInteger: "The order must be an integer.",
  orderNumber: "The order must be a number.",
  orderMaxDigits: "The order may not be greater than 999999999.",
  versionIdInteger: "The version id must be an integer.",
  versionIdMin: "The version id must be at least 1.",
  messageRequired: "The message field is required.",
  primaryColorRequired: "The primary color field is required.",
  secondaryColorRequired: "The secondary color field is required.",

  // ─── Feedback ───────────────────────────────────────────────────────────────
  feedback: {
    clientIdRequired: "The client id field is required.",
    eventNameRequired: "The event name field is required.",
    pageTitleRequired: "The page title field is required.",
    resellerIdRequired: "The reseller id field is required.",
    sessionIdRequired: "The session id field is required.",
    siteDomainRequired: "The site domain field is required.",
    siteTypeRequired: "The site type field is required.",
    ratingRequired: "The rating field is required.",
    feedbackRequired: "The feedback field is required.",
    clientIdInvalid: "The client id field must be a valid ULID.",
    sessionIdInvalid: "The session id field must be a valid ULID.",
    eventNameInvalid: "The selected event name is invalid.",
    pageTitleString: "The page title must be a string.",
    resellerIdInvalid: "The selected reseller id is invalid.",
    siteDomainString: "The site domain must be a string.",
    siteTypeInvalid: "The selected site type is invalid.",
    ratingAtLeast: "The rating must be at least 1.",
    ratingAtMost: "The rating may not be greater than 5.",
    ratingInteger: "The rating must be an integer.",
    feedbackInvalid: "The selected feedback is invalid.",
  },

  // ─── Instance Layouts ───────────────────────────────────────────────────────
  instanceLayouts: {
    bannerRequired: "The banner field is required.",
    bannerInvalid: "The banner must end with one of the following: .jpg, .png, .jpeg, .svg.",
    footerRequired: "The footer field is required.",
    footerType: "The footer must be a string.",
    subFooterRequired: "The sub footer field is required.",
    subFooterInvalid: "The sub footer field must be true or false.",
  },

  // ─── Homepage Resources ─────────────────────────────────────────────────────
  homepageResources: {
    resourceIdRequired: "The resource id field is required.",
    resourceIdInteger: "The resource id must be an integer.",
    resourceIdMin: "The resource id must be at least 1.",
    versionIdVideoOnly: "The version id field is only applicable to the video resource type.",
    resourceTypeRequired: "The resource type field is required.",
    resourceTypeInvalid: "The selected resource type is invalid.",
    duplicateResource: "The resource has already been attached to this instance.",
  },

  // ─── Homepage Videos ────────────────────────────────────────────────────────
  homepageVideos: {
    orderMin: "The order must be at least 0.",
    versionIdPresent: "The version id field must be present.",
    versionIdMax: "The version id must be between 1 and 10 digits.",
    versionIdInvalid: "The selected version id is invalid.",
    duplicateVideo: "The video has already been added to this homepage.",
    videoNotInBucket: "Video Does Not Exist in Bucket",
  },

  // ─── Instance Settings ──────────────────────────────────────────────────────
  instanceSettings: {
    keyRequired: "The key field is required.",
    keyInvalid: "The selected key is invalid.",
    valueRequired: "The value field is required.",
    valueInvalid: "The value field must be true or false.",
  },

  // ─── Instance Pages ─────────────────────────────────────────────────────────
  instancePages: {
    langInvalid: "The selected lang is invalid.",
    thumbnailUrlInvalid: "The thumbnail url format is invalid.",
    relatedIdMin: "The related id must be at least 0.",
    relatedIdInteger: "The related id must be a number.",
    relatedIdInvalid: "The selected related id is invalid.",
    iconThumbnailExclusive: "The icon field is prohibited when thumbnail url is present.",
  },

  // ─── Instance Buttons ───────────────────────────────────────────────────────
  instanceButtons: {
    titleMax: "The title may not be greater than 100 characters.",
    placementRequired: "The placement field is required.",
    placementInvalid: "The selected placement is invalid.",
    typeRequired: "The type field is required.",
    typeInvalid: "The selected type is invalid.",
    contentRequired: "The content field is required.",
  },

  // ─── Instances ──────────────────────────────────────────────────────────────
  instances: {
    layoutRequired: "The layout field is required.",
    layoutInvalid: "The selected theme is invalid.",
    layoutType: "The layout must be a string.",
    invalidDisplayLogo: "The display logo field must be true or false.",
    primaryColorType: "The primary color must be a string.",
    secondaryColorType: "The secondary color must be a string.",
    primaryColorInvalid: "The primary color field must be a valid hexadecimal color.",
    secondaryColorInvalid: "The secondary color field must be a valid hexadecimal color.",
    slugRequired: "The slug field is required.",
    slugMax: "The slug may not be greater than 60 characters.",
    slugType: "The slug must be a string.",
    slugInvalid: "The slug format is invalid.",
    slugAlreadyTaken: "The slug has already been taken.",
  },
};
