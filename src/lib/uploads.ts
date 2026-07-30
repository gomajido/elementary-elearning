export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const ASSIGNMENT_ATTACHMENT_EXACT_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function isAllowedAssignmentAttachmentContentType(contentType: string) {
  return contentType.startsWith("image/") || ASSIGNMENT_ATTACHMENT_EXACT_CONTENT_TYPES.includes(contentType);
}
