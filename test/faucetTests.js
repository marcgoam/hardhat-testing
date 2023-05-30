const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Faucet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy();

    const [owner, alice, bob] = await ethers.getSigners();

    await alice.sendTransaction({
      to: faucet.address,
      value: ethers.utils.parseEther("1"),
    });

    console.log("Signer 1 address: ", owner.address);
    console.log("Alice address: ", alice.address);
    console.log("Bob address: ", bob.address);

    return { faucet, owner, alice };
  }

  it("should deploy and set the owner correctly", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it("should not withdraw all out more than minimum", async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);

    await expect(
      faucet.withdraw(ethers.utils.parseEther("0.2"))
    ).to.be.revertedWith("So much ether");
  });

  it("should withdraw when is minus than minimum", async function () {
    const { faucet, alice } = await loadFixture(deployContractAndSetVariables);
    const balance = await alice.getBalance();
    await faucet.connect(alice).withdraw(ethers.utils.parseEther("0.02"));
    expect(await alice.getBalance()).to.be.greaterThan(balance);
  });

  it("should only be called by contract owner", async function () {
    const { faucet, alice } = await loadFixture(deployContractAndSetVariables);

    expect(faucet.connect(alice).withdrawAll()).to.be.revertedWith(
      "You are not the owner"
    );
  });

  it("should withdraw all the balance of the contract", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);
    const balance = await owner.getBalance();

    await faucet.connect(owner).withdrawAll();

    expect(await owner.getBalance()).to.be.greaterThan(balance);
  });

  it("destroy the contract", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    await faucet.connect(owner).destroyFaucet();

    expect(await ethers.provider.getCode(faucet.address)).to.be.equal("0x");
  });

  it("should not be able to destroy the contract", async function () {
    const { faucet, alice } = await loadFixture(deployContractAndSetVariables);

    expect(faucet.connect(alice).destroyFaucet()).to.be.revertedWith(
      "You are not the owner"
    );
  });
});
