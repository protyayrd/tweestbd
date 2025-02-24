import React from "react";

const AddressCard = ({address}) => {
  return (
    <div>
      {/* <h1 className="text-lg font-semibold py-4">Delivery Adress</h1> */}
      <div className="space-y-3">
        <p className="font-semibold">{`${address?.firstName} ${address?.lastName}`}</p>

        <p>
          {`${address?.streetAddress}, ${address?.upazilla ? `${address?.upazilla}, ` : ''}${address?.district || address?.city}, ${address?.division || address?.state} - ${address?.zipCode}`}
        </p>

        <div className="space-y-1">
          <p className="font-semibold">Phone Number</p>
          <p>{address?.mobile || address?.phoneNumber}</p>
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
