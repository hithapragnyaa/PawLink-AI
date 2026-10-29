import {
  getOrganizationById,
  updateOrganization,
} from "../services/organization.service.js";

export const getMyOrganization = async (req, res, next) => {
  try {
    const organization = await getOrganizationById(
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyOrganization = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      description,
    } = req.body;

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Organization name must contain at least 2 characters.",
        });
      }
    }

    const organization = await updateOrganization(
      req.user.organizationId,
      {
        name:
          name !== undefined
            ? name.trim()
            : undefined,
        email:
          email !== undefined
            ? email.trim().toLowerCase()
            : undefined,
        phone:
          phone !== undefined
            ? phone.trim()
            : undefined,
        address:
          address !== undefined
            ? address.trim()
            : undefined,
        city:
          city !== undefined
            ? city.trim()
            : undefined,
        state:
          state !== undefined
            ? state.trim()
            : undefined,
        country:
          country !== undefined
            ? country.trim()
            : undefined,
        description:
          description !== undefined
            ? description.trim()
            : undefined,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully.",
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};