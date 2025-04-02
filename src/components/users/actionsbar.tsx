import * as React from "react";
import { UserCreationDialog } from "./user-create-dialog";


export default function ActionsBar() {
  return (
    <div className="flex justify-between mb-4">
      <div>
        <UserCreationDialog />
      </div>
    </div>
  );
}