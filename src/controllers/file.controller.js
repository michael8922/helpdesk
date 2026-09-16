import {
  attachFileToTicket,
  deleteTicketAttachment,
} from "../services/file.service.js";

/** POST /tickets/:id/attachment */
export async function uploadTicketAttachment(req, res, next) {
  try {
    // express-fileupload agrega req.files a la request.
    // `attachment` debe coincidir con la key usada en Postman, Web y CLI.
    const uploadedFile = req.files?.attachment;

    const ticket = await attachFileToTicket(req.params.id, uploadedFile);

    return res.status(200).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

/** DELETE /tickets/:id/attachment */
export async function removeTicketAttachment(req, res, next) {
  try {
    const ticket = await deleteTicketAttachment(req.params.id);

    return res.status(200).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}
